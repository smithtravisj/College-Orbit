// Learning Suite (BYU) content script - scrapes assignment data and injects button
// Supports: gradebook/assignments page (inline expand) and discussion pages

const LS_GRADEBOOK_RE = /learningsuite\.byu\.edu\/.*\/student\/gradebook/;
const LS_DISCUSSION_RE = /learningsuite\.byu\.edu\/.*\/student\/discuss\/discussion\/id-([A-Za-z0-9_-]+)/;
const LS_CID_RE = /\/cid-([^/]+)/;
const LS_ANY_PAGE = /learningsuite\.byu\.edu\//;

function getCourseId() {
  const match = window.location.href.match(LS_CID_RE);
  return match ? match[1] : '';
}

function scrapeCourseName() {
  // Learning Suite shows the course name in a dropdown/button in the top header area.
  // Look for any element whose text matches a course code pattern like "WRTG 150" or "CS 235"
  // Common selectors: buttons, links, spans in the header/nav area
  const candidates = document.querySelectorAll('header *, nav *, [class*="course"], [class*="header"], [class*="nav"], button, .dropdown-toggle, [class*="dropdown"]');
  for (const el of candidates) {
    const t = el.textContent?.trim();
    if (t && /^[A-Z]{2,5}\s*\d{3}/.test(t) && t.length < 80) {
      // Found something like "WRTG 150 - Writing" or "CS 235"
      console.log('[College Orbit] Course name from header element:', t);
      return t;
    }
  }

  // Try select elements (dropdown with course list)
  const selects = document.querySelectorAll('select');
  for (const sel of selects) {
    const selected = sel.options?.[sel.selectedIndex];
    if (selected?.textContent?.trim()) {
      const t = selected.textContent.trim();
      if (/^[A-Z]{2,5}\s*\d{3}/.test(t) || (t.length < 60 && t.length > 3)) {
        return t;
      }
    }
  }

  // Scan all visible text for course code pattern as last resort
  const allEls = document.querySelectorAll('h1, h2, h3, a, span, div, p');
  for (const el of allEls) {
    // Only direct text (not children) to avoid picking up huge blocks
    if (el.children.length > 3) continue;
    const t = el.textContent?.trim();
    if (t && /^[A-Z]{2,5}\s+\d{3}\b/.test(t) && t.length < 80 && t.length > 4) {
      console.log('[College Orbit] Course name from page scan:', t);
      return t;
    }
  }

  // Try the page title
  const titleText = document.title || '';
  const titleMatch = titleText.match(/^(.+?)\s*[-|]\s*Learning Suite/i);
  if (titleMatch) return titleMatch[1].trim();

  // Try to extract course code from title
  const codeMatch = titleText.match(/([A-Z]{2,5}\s*\d{3}\S*)/);
  if (codeMatch) return codeMatch[1];

  return titleText.replace('Learning Suite', '').replace('|', '').trim() || '';
}

function parseLSDate(text) {
  if (!text) return null;

  const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/);
  let hours = 23, minutes = 59;
  if (timeMatch) {
    hours = parseInt(timeMatch[1]);
    minutes = parseInt(timeMatch[2]);
    const ampm = timeMatch[3].toLowerCase();
    if (ampm === 'pm' && hours !== 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
  }

  const dateOnly = text.replace(/\s*(at\s+)?\d{1,2}:\d{2}\s*(am|pm|AM|PM)\s*([A-Z]{2,4})?/i, '').trim();
  const now = new Date();

  let parsed = new Date(dateOnly);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2024) {
    parsed.setHours(hours, minutes, 0, 0);
    return parsed.toISOString();
  }

  const withYear = dateOnly + ', ' + now.getFullYear();
  parsed = new Date(withYear);
  if (!isNaN(parsed.getTime())) {
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    parsed.setHours(hours, minutes, 0, 0);
    if (parsed < twoMonthsAgo) {
      parsed = new Date(dateOnly + ', ' + (now.getFullYear() + 1));
      parsed.setHours(hours, minutes, 0, 0);
    }
    return parsed.toISOString();
  }

  return null;
}

// Find the active/expanded sub-assignment row on the gradebook page.
// Learning Suite uses Vue.js grid rows. The expanded row has class "bg-accent".
// Each sub-assignment row uses CSS grid with areas: icon title due submissions plagiarism score percent.
function findActiveAssignmentRow() {
  // The active/expanded sub-assignment row has bg-accent class
  const activeRow = document.querySelector('.bg-accent[style*="grid-template"]');
  if (activeRow) {
    console.log('[College Orbit] Found active row via bg-accent');
    return activeRow;
  }

  // Fallback: find the row with a caret-down icon (expanded unit) and look for bg-accent inside
  const carets = document.querySelectorAll('.fa-caret-down');
  for (const caret of carets) {
    const unitContainer = caret.closest('[data-v-313543]') || caret.closest('div');
    if (unitContainer) {
      const active = unitContainer.querySelector('.bg-accent[style*="grid-template"]');
      if (active) return active;
    }
  }

  return null;
}

function scrapeGradebookAssignment() {
  const activeRow = findActiveAssignmentRow();
  if (!activeRow) {
    console.log('[College Orbit] No expanded assignment found');
    return null;
  }

  // Title: the span in col-start-2 that starts with "ASSIGNMENT:", "WORKSHOP:", "QUIZ:", etc.
  let title = '';
  const titleSpan = activeRow.querySelector('.col-start-2 span, .justify-self-start span');
  if (titleSpan) {
    title = titleSpan.textContent.trim();
  }
  if (!title) {
    // Fallback: get text from the second grid cell
    const cells = activeRow.querySelectorAll('div');
    for (const cell of cells) {
      const t = cell.textContent.trim();
      if (t.length > 3 && t.length < 200 && !t.includes('%') && !/^\d/.test(t)) {
        title = t;
        break;
      }
    }
  }

  // Due date: prefer <time datetime="..."> element within or after the active row
  let dueDate = null;
  // Look in the row itself and its sibling detail area
  const rowParent = activeRow.parentElement;
  const timeEl = activeRow.querySelector('time[datetime]') ||
    (rowParent && rowParent.querySelector('time[datetime]'));
  if (timeEl) {
    const dt = timeEl.getAttribute('datetime');
    if (dt) {
      dueDate = new Date(dt).toISOString();
    }
  }

  // Points: look for "/10.0" pattern in the row
  let points = null;
  const rowText = activeRow.textContent || '';
  const pointsMatch = rowText.match(/\/\s*(\d+(?:\.\d+)?)/);
  if (pointsMatch) points = parseFloat(pointsMatch[1]);

  // Description + links: find the detail/content panel that appears when expanded.
  let description = '';
  let discussionUrl = '';

  // Find the detail panel (next non-grid sibling of the active row)
  function findDetailPanel(startEl) {
    let el = startEl;
    while (el) {
      const style = el.getAttribute('style') || '';
      if (style.includes('grid-template')) { el = el.nextElementSibling; continue; }
      if (el.offsetHeight > 0 && (el.innerText?.trim() || '').length > 10) return el;
      el = el.nextElementSibling;
    }
    return null;
  }

  let detailPanel = findDetailPanel(activeRow.nextElementSibling);
  if (!detailPanel) {
    const container = activeRow.parentElement;
    if (container) {
      const children = Array.from(container.children);
      const idx = children.indexOf(activeRow);
      for (let i = idx + 1; i < children.length; i++) {
        const style = children[i].getAttribute('style') || '';
        if (style.includes('grid-template')) continue;
        if (children[i].offsetHeight > 0 && (children[i].innerText?.trim() || '').length > 10) {
          detailPanel = children[i];
          break;
        }
      }
    }
  }

  if (detailPanel) {
    // Extract discussion link before stripping buttons
    const links = detailPanel.querySelectorAll('a[href]');
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      const text = a.textContent?.trim().toLowerCase() || '';
      if (text.includes('discussion') || text.includes('discuss') || href.includes('/discuss')) {
        discussionUrl = href.startsWith('http') ? href : 'https://learningsuite.byu.edu' + href;
        break;
      }
    }

    // Get text, stripping button elements first
    const clone = detailPanel.cloneNode(true);
    // Remove buttons and button-like elements
    clone.querySelectorAll('button, [role="button"], a.btn, [class*="btn"], input[type="submit"], input[type="button"]').forEach(b => b.remove());
    // Remove links that are action buttons (Submit, Resubmit, Open Discussion, Check, Uncheck)
    clone.querySelectorAll('a').forEach(a => {
      const t = a.textContent?.trim().toLowerCase() || '';
      if (/^(submit|resubmit|check|uncheck|open discussion|view\/submit|view|upload)$/i.test(t)) {
        a.remove();
      }
    });

    description = clone.innerText?.trim() || '';
    description = description
      .replace(/^\s*(Description|Submission)\s*$/gm, '')
      .replace(/^\s*Due:.*$/gm, '')
      .replace(/\s*View\/Submit\s*/g, '')
      .replace(/^(Submit|Resubmit|Check|Uncheck|Open Discussion|Upload)\s*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  console.log('[College Orbit] Description length:', description.length, 'discussion URL:', discussionUrl);

  console.log('[College Orbit] Scraped LS assignment:', { title, dueDate, points });

  if (!title) return null;

  return {
    title,
    dueDate,
    points,
    description,
    discussionUrl,
    courseName: scrapeCourseName(),
    lsCourseId: getCourseId(),
    lsItemId: '',
    lsPageType: 'assignment',
    source: 'learningsuite',
    canvasUrl: window.location.href.split('?')[0],
  };
}

function scrapeDiscussion() {
  const url = window.location.href;
  const match = url.match(LS_DISCUSSION_RE);

  // Title: H1 contains title + "Participants" + participant list. Extract just the title part.
  let title = '';
  const h1 = document.querySelector('h1');
  if (h1) {
    const fullText = h1.textContent?.trim() || '';
    // Split at "Participants" to get just the title
    title = fullText.split(/\s*Participants\b/)[0].trim();
  }
  if (!title) {
    const pageTitle = document.title || '';
    const m = pageTitle.match(/^(.+?)\s*[-|]/);
    title = m ? m[1].trim() : pageTitle.trim();
  }

  // Description: the instructor's post is in a div with class "instructorText"
  // or inside .bg-accent (the highlighted post container)
  let description = '';
  const instructorText = document.querySelector('.instructorText, [class*="instructorText"]');
  if (instructorText) {
    description = instructorText.innerText?.trim() || '';
  }
  if (!description) {
    // Fallback: look for the main post content inside bg-accent
    const accentPost = document.querySelector('.bg-accent');
    if (accentPost) {
      // Skip the author name (H2), get the content div
      const contentDivs = accentPost.querySelectorAll('div');
      for (const div of contentDivs) {
        const t = div.innerText?.trim() || '';
        if (t.length > 50 && !t.includes('Participants') && div.children.length < 15) {
          description = t;
          break;
        }
      }
    }
  }
  // Clean up: remove "Closes ..." line from description if it got included
  description = description.replace(/\s*Closes\s+[A-Z][a-z]+\s+\d{1,2}\s+\d{1,2}:\d{2}\s*(?:am|pm)\s*(?:[A-Z]{3,4})?\s*/gi, '').trim();

  // Due date: look for "Closes Feb 24 11:59 pm MST" in the page
  let dueDate = null;
  const bodyText = document.body.innerText || '';
  const closesMatch = bodyText.match(/Closes\s+([A-Z][a-z]+\s+\d{1,2}\s+\d{1,2}:\d{2}\s*(?:am|pm)\s*(?:[A-Z]{3,4})?)/i);
  if (closesMatch) {
    dueDate = parseLSDate(closesMatch[1]);
  }
  if (!dueDate) {
    const dueMatch = bodyText.match(/[Dd]ue[:\s]+([A-Z][a-z]+\s+\d{1,2}(?:,?\s*\d{4})?\s+\d{1,2}:\d{2}\s*(?:am|pm))/i);
    if (dueMatch) dueDate = parseLSDate(dueMatch[1]);
  }
  if (!dueDate) {
    const timeEl = document.querySelector('time[datetime]');
    if (timeEl) {
      const dt = timeEl.getAttribute('datetime');
      if (dt) dueDate = new Date(dt).toISOString();
    }
  }

  console.log('[College Orbit] Discussion scraped:', { title, dueDate, descLen: description.length });

  return {
    title,
    dueDate,
    points: null,
    description,
    courseName: scrapeCourseName(),
    lsCourseId: getCourseId(),
    lsItemId: match ? match[1] : '',
    lsPageType: 'discussion',
    source: 'learningsuite',
    canvasUrl: url.split('?')[0],
  };
}

function scrapeAssignmentData() {
  if (LS_DISCUSSION_RE.test(window.location.href)) return scrapeDiscussion();
  if (LS_GRADEBOOK_RE.test(window.location.href)) return scrapeGradebookAssignment();
  return null;
}

function checkIfAlreadyAdded(data) {
  const btn = document.getElementById('orbit-add-btn');
  if (!btn) return;
  if (!data?.title) {
    // Reset button if no assignment expanded
    btn.textContent = '+ Add to Orbit';
    btn.classList.remove('orbit-added');
    btn.disabled = false;
    btn.onclick = null;
    return;
  }
  chrome.runtime.sendMessage(
    { type: 'CHECK_ASSIGNMENT_EXISTS', title: data.title, canvasUrl: data.canvasUrl },
    (response) => {
      if (chrome.runtime.lastError) return;
      if (response?.exists) {
        btn.textContent = '\u2713 Already in Orbit';
        btn.classList.add('orbit-added');
      } else {
        btn.textContent = '+ Add to Orbit';
        btn.classList.remove('orbit-added');
        btn.disabled = false;
      }
    }
  );
}

// Inject floating button
function injectButton() {
  if (document.getElementById('orbit-add-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'orbit-add-btn';
  btn.textContent = '+ Add to Orbit';
  btn.addEventListener('click', () => {
    if (btn.classList.contains('orbit-added')) {
      window.open('https://collegeorbit.app/work', '_blank');
      return;
    }
    const data = scrapeAssignmentData();
    if (!data || !data.title) {
      btn.textContent = 'Expand an assignment first';
      setTimeout(() => { btn.textContent = '+ Add to Orbit'; }, 2000);
      return;
    }

    btn.textContent = 'Adding...';
    btn.disabled = true;

    chrome.runtime.sendMessage({ type: 'ADD_ASSIGNMENT', data }, (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        btn.textContent = 'Error — try again';
        btn.disabled = false;
        setTimeout(() => { btn.textContent = '+ Add to Orbit'; }, 3000);
        return;
      }
      btn.textContent = '\u2713 Added to Orbit';
      btn.classList.add('orbit-added');
      // Reset after a few seconds so user can add another assignment
      setTimeout(() => {
        btn.textContent = '+ Add to Orbit';
        btn.classList.remove('orbit-added');
        btn.disabled = false;
      }, 3000);
    });
  });

  // Position bottom-right on Learning Suite (CSS default is top-right for Canvas)
  btn.style.top = 'auto';
  btn.style.bottom = '24px';

  document.body.appendChild(btn);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPE_ASSIGNMENT') {
    sendResponse(scrapeAssignmentData());
  }
  if (message.type === 'ASSIGNMENT_ADDED') {
    const btn = document.getElementById('orbit-add-btn');
    if (btn) {
      btn.textContent = '\u2713 Added to Orbit';
      btn.classList.add('orbit-added');
    }
  }
});

function init() {
  const url = window.location.href;

  if (LS_GRADEBOOK_RE.test(url) || LS_DISCUSSION_RE.test(url)) {
    injectButton();

    // Store scraped data for popup (may be null on gradebook if nothing expanded)
    const data = scrapeAssignmentData();
    if (data) {
      chrome.storage.local.set({ orbit_scraped: data });
    } else {
      // Clear stale data so popup doesn't show old Canvas info
      chrome.storage.local.remove('orbit_scraped');
    }

    // Check if current assignment already exists in Orbit
    checkIfAlreadyAdded(data);
  } else {
    // Not a supported LS page - clear stale data
    chrome.storage.local.remove('orbit_scraped');
  }
}

init();

// Watch for SPA navigation
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    const btn = document.getElementById('orbit-add-btn');
    if (btn) btn.remove();
    setTimeout(init, 1000);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// On gradebook, listen for clicks to detect assignment row expansion
if (LS_GRADEBOOK_RE.test(window.location.href)) {
  let lastActiveTitle = '';
  document.addEventListener('click', () => {
    // Delay to let Vue update the DOM after click
    setTimeout(() => {
      const data = scrapeAssignmentData();
      const currentTitle = data?.title || '';
      if (currentTitle !== lastActiveTitle) {
        lastActiveTitle = currentTitle;
        if (data) {
          chrome.storage.local.set({ orbit_scraped: data });
        } else {
          chrome.storage.local.remove('orbit_scraped');
        }
        checkIfAlreadyAdded(data);
      }
    }, 500);
  });
}
