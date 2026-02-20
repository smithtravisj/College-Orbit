// Learning Suite (BYU) content script - scrapes assignment data and injects button
// Supports: gradebook/assignments page (inline expand), discussion pages, and exam pages

const LS_GRADEBOOK_RE = /learningsuite\.byu\.edu\/.*\/student\/gradebook/;
const LS_DISCUSSION_RE = /learningsuite\.byu\.edu\/.*\/student\/discuss\/discussion\/id-([A-Za-z0-9_-]+)/;
const LS_EXAM_RE = /learningsuite\.byu\.edu\/.*\/student\/exam\/info\/id-([A-Za-z0-9_-]+)/;
const LS_CID_RE = /\/cid-([^/]+)/;
const LS_ANY_PAGE = /learningsuite\.byu\.edu\//;

function getCourseId() {
  const match = window.location.href.match(LS_CID_RE);
  return match ? match[1] : '';
}

function scrapeCourseName() {
  // Course code patterns - handles "CS 142", "WRTG 150", "A HTG 100", etc.
  // Pattern: 1-5 letters, optional space + more letters, then space + 3 digits
  const courseCodePattern = /^[A-Z]{1,5}(?:\s+[A-Z]{1,5})?\s*\d{3}/;

  // Learning Suite shows the course name in a dropdown/button in the top header area.
  // Look for any element whose text matches a course code pattern
  const candidates = document.querySelectorAll('header *, nav *, [class*="course"], [class*="header"], [class*="nav"], button, .dropdown-toggle, [class*="dropdown"]');
  for (const el of candidates) {
    const t = el.textContent?.trim();
    if (t && courseCodePattern.test(t) && t.length < 80) {
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
      if (courseCodePattern.test(t) || (t.length < 60 && t.length > 3)) {
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
    if (t && courseCodePattern.test(t) && t.length < 80 && t.length > 4) {
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
    return formatLocalISO(parsed);
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
    return formatLocalISO(parsed);
  }

  return null;
}

// Format date as ISO string preserving local time (not converting to UTC)
function formatLocalISO(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const mins = pad(date.getMinutes());
  const secs = pad(date.getSeconds());
  // Return ISO format with timezone offset
  const offset = -date.getTimezoneOffset();
  const offsetHrs = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMins = pad(Math.abs(offset) % 60);
  const offsetSign = offset >= 0 ? '+' : '-';
  return `${year}-${month}-${day}T${hours}:${mins}:${secs}${offsetSign}${offsetHrs}:${offsetMins}`;
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
    console.log('[College Orbit LS] Found datetime attribute:', dt);
    if (dt) {
      // Learning Suite calculates UTC using CURRENT timezone offset, but we need the offset
      // that will be in effect on the due DATE (to handle DST correctly).
      // Parse the UTC time, then recalculate using the correct offset for that date.
      const utcDate = new Date(dt);
      if (!isNaN(utcDate.getTime())) {
        // Create a date in local time for the same calendar date/time
        // This ensures DST is calculated for the TARGET date, not today
        const localDate = new Date(
          utcDate.getUTCFullYear(),
          utcDate.getUTCMonth(),
          utcDate.getUTCDate(),
          utcDate.getUTCHours(),
          utcDate.getUTCMinutes(),
          utcDate.getUTCSeconds()
        );
        // Now get the offset for THIS date (which accounts for DST on that date)
        const targetOffset = localDate.getTimezoneOffset();
        // The datetime attr was calculated with current offset, recalculate with target offset
        const currentOffset = new Date().getTimezoneOffset();
        const offsetDiff = (targetOffset - currentOffset) * 60 * 1000; // in ms
        const correctedDate = new Date(utcDate.getTime() + offsetDiff);
        dueDate = correctedDate.toISOString();
        console.log('[College Orbit LS] DST-corrected date:', dueDate, 'offset diff (hrs):', offsetDiff / 3600000);
      } else {
        dueDate = dt;
      }
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
      if (dt) {
        // Apply same DST correction as gradebook assignments
        const utcDate = new Date(dt);
        if (!isNaN(utcDate.getTime())) {
          const localDate = new Date(
            utcDate.getUTCFullYear(),
            utcDate.getUTCMonth(),
            utcDate.getUTCDate(),
            utcDate.getUTCHours(),
            utcDate.getUTCMinutes(),
            utcDate.getUTCSeconds()
          );
          const targetOffset = localDate.getTimezoneOffset();
          const currentOffset = new Date().getTimezoneOffset();
          const offsetDiff = (currentOffset - targetOffset) * 60 * 1000;
          const correctedDate = new Date(utcDate.getTime() + offsetDiff);
          dueDate = correctedDate.toISOString();
        } else {
          dueDate = dt;
        }
      }
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

function scrapeExam() {
  const url = window.location.href;
  const match = url.match(LS_EXAM_RE);

  // Title: look for h1 or prominent heading
  let title = '';
  const h1 = document.querySelector('h1');
  if (h1) {
    title = h1.textContent?.trim() || '';
  }
  if (!title) {
    const h2 = document.querySelector('h2');
    if (h2) title = h2.textContent?.trim() || '';
  }

  // Due date / exam date: look for date-like text near "Date", "Opens", "Closes", "Due"
  let dueDate = null;
  const bodyText = document.body.innerText || '';

  // Try "Closes <date>" pattern
  const closesMatch = bodyText.match(/Closes\s+([A-Z][a-z]+\s+\d{1,2}\s+\d{1,2}:\d{2}\s*(?:am|pm)\s*(?:[A-Z]{3,4})?)/i);
  if (closesMatch) {
    dueDate = parseLSDate(closesMatch[1]);
  }

  // Try "Due <date>" pattern
  if (!dueDate) {
    const dueMatch = bodyText.match(/[Dd]ue[:\s]+([A-Z][a-z]+\s+\d{1,2}(?:,?\s*\d{4})?\s+\d{1,2}:\d{2}\s*(?:am|pm))/i);
    if (dueMatch) dueDate = parseLSDate(dueMatch[1]);
  }

  // Try <time> elements
  if (!dueDate) {
    const timeEl = document.querySelector('time[datetime]');
    if (timeEl) {
      const dt = timeEl.getAttribute('datetime');
      if (dt) {
        const utcDate = new Date(dt);
        if (!isNaN(utcDate.getTime())) {
          const localDate = new Date(
            utcDate.getUTCFullYear(),
            utcDate.getUTCMonth(),
            utcDate.getUTCDate(),
            utcDate.getUTCHours(),
            utcDate.getUTCMinutes(),
            utcDate.getUTCSeconds()
          );
          const targetOffset = localDate.getTimezoneOffset();
          const currentOffset = new Date().getTimezoneOffset();
          const offsetDiff = (currentOffset - targetOffset) * 60 * 1000;
          const correctedDate = new Date(utcDate.getTime() + offsetDiff);
          dueDate = correctedDate.toISOString();
        }
      }
    }
  }

  // Try generic date patterns like "Feb 20, 2026" or "February 20 at 11:59pm"
  if (!dueDate) {
    const datePattern = bodyText.match(/(?:Date|Opens|Available|Start)[:\s]+([A-Z][a-z]+\s+\d{1,2}(?:,?\s*\d{4})?(?:\s+(?:at\s+)?\d{1,2}:\d{2}\s*(?:am|pm))?)/i);
    if (datePattern) dueDate = parseLSDate(datePattern[1]);
  }

  // Description: look for content area
  let description = '';
  const descSelectors = [
    '.user_content',
    '[class*="description"]',
    '[class*="content"]',
    '.card-body',
  ];
  for (const sel of descSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText?.trim().length > 20) {
      description = el.innerText.trim();
      break;
    }
  }

  // Points
  let points = null;
  const pointsMatch = bodyText.match(/(?:Points|Score|Worth)[:\s]+(\d+(?:\.\d+)?)/i);
  if (pointsMatch) points = parseFloat(pointsMatch[1]);

  console.log('[College Orbit] Exam scraped:', { title, dueDate, points, descLen: description.length });

  if (!title) return null;

  return {
    title,
    dueDate,
    points,
    description,
    courseName: scrapeCourseName(),
    lsCourseId: getCourseId(),
    lsItemId: match ? match[1] : '',
    lsPageType: 'exam',
    source: 'learningsuite',
    canvasUrl: url.split('?')[0],
  };
}

function scrapeAssignmentData() {
  if (LS_EXAM_RE.test(window.location.href)) return scrapeExam();
  if (LS_DISCUSSION_RE.test(window.location.href)) return scrapeDiscussion();
  if (LS_GRADEBOOK_RE.test(window.location.href)) return scrapeGradebookAssignment();
  return null;
}

// Track current work item state and data
let currentWorkItem = { id: null, status: null, currentData: null };
let scrapedData = null;

// Compare scraped data with stored data to detect changes
function detectChanges(scraped, stored) {
  if (!scraped || !stored) return false;

  const changes = [];

  // Check title
  if (scraped.title && scraped.title !== stored.title) {
    changes.push('title');
  }

  // Check due date (compare as dates, allow 1 minute tolerance)
  console.log('[College Orbit LS] Due date comparison:', { scrapedDueDate: scraped.dueDate, storedDueAt: stored.dueAt });
  if (scraped.dueDate && stored.dueAt) {
    const scrapedDate = new Date(scraped.dueDate).getTime();
    const storedDate = new Date(stored.dueAt).getTime();
    const diff = Math.abs(scrapedDate - storedDate);
    console.log('[College Orbit LS] Due date diff (ms):', diff, 'scraped:', scrapedDate, 'stored:', storedDate);
    if (diff > 60000) {
      changes.push('due date');
    }
  } else if (scraped.dueDate && !stored.dueAt) {
    changes.push('due date');
  } else if (!scraped.dueDate && stored.dueAt) {
    // Stored has date but scraped doesn't - might be a scraping issue, don't flag as change
    console.log('[College Orbit LS] Stored has due date but scraped does not');
  }

  // Check if Learning Suite link exists
  const hasSourceLink = (stored.links || []).some(l => l.label === 'Learning Suite');
  if (scraped.canvasUrl && !hasSourceLink) {
    changes.push('link');
  }

  // Check description - only if scraped has description and stored doesn't have LMS section
  if (scraped.description) {
    const lmsSectionExists = (stored.notes || '').includes('─── From Learning Suite ───');
    if (!lmsSectionExists) {
      changes.push('description');
    }
  }

  console.log('[College Orbit LS] Detected changes:', changes);
  return changes.length > 0 ? changes : false;
}

// Update button state and dropdown options
function updateButtonState(state, workItemId = null, workItemStatus = null, currentData = null) {
  console.log('[College Orbit LS] updateButtonState called with:', { state, workItemId, workItemStatus });
  const btn = document.getElementById('orbit-add-btn');
  const dropdown = document.getElementById('orbit-dropdown');
  if (!btn || !dropdown) {
    console.log('[College Orbit LS] Button or dropdown not found!');
    return;
  }

  currentWorkItem = { id: workItemId, status: workItemStatus, currentData };

  // Clear dropdown
  dropdown.innerHTML = '';

  switch (state) {
    case 'add':
      btn.textContent = '+ Add to Orbit';
      btn.className = '';
      btn.disabled = false;
      // Restore bottom positioning for Learning Suite
      btn.style.top = 'auto';
      btn.style.bottom = '24px';
      break;

    case 'needs-update':
      btn.textContent = '\u21bb Update in Orbit';
      btn.className = 'orbit-needs-update has-dropdown';
      btn.disabled = false;

      // Add dropdown options
      const updateBtn = document.createElement('button');
      updateBtn.className = 'orbit-dropdown-item warning';
      updateBtn.textContent = 'Update Now';
      updateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateWorkItem();
      });

      const viewBtnUpdate = document.createElement('button');
      viewBtnUpdate.className = 'orbit-dropdown-item';
      viewBtnUpdate.textContent = 'View in Orbit';
      viewBtnUpdate.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(`https://collegeorbit.app/work?task=${workItemId}`, '_blank');
        dropdown.classList.remove('show');
      });

      const skipBtn = document.createElement('button');
      skipBtn.className = 'orbit-dropdown-item';
      skipBtn.textContent = 'Skip Update';
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.remove('show');
        updateButtonState(workItemStatus === 'done' ? 'completed' : 'exists', workItemId, workItemStatus, currentData);
      });

      dropdown.appendChild(updateBtn);
      dropdown.appendChild(viewBtnUpdate);
      dropdown.appendChild(skipBtn);
      break;

    case 'added':
    case 'exists':
      btn.textContent = '\u2713 In Orbit';
      btn.className = 'orbit-added has-dropdown';
      btn.disabled = false;

      // Add dropdown options
      const markCompleteBtn = document.createElement('button');
      markCompleteBtn.className = 'orbit-dropdown-item success';
      markCompleteBtn.textContent = 'Mark Complete';
      markCompleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        markWorkItem('complete');
      });

      const viewBtn = document.createElement('button');
      viewBtn.className = 'orbit-dropdown-item';
      viewBtn.textContent = 'View in Orbit';
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(`https://collegeorbit.app/work?task=${workItemId}`, '_blank');
        dropdown.classList.remove('show');
      });

      dropdown.appendChild(markCompleteBtn);
      dropdown.appendChild(viewBtn);
      break;

    case 'completed':
      btn.textContent = '\u2713 Completed';
      btn.className = 'orbit-completed has-dropdown';
      btn.disabled = false;

      // Add dropdown options
      const markIncompleteBtn = document.createElement('button');
      markIncompleteBtn.className = 'orbit-dropdown-item warning';
      markIncompleteBtn.textContent = 'Mark Incomplete';
      markIncompleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        markWorkItem('incomplete');
      });

      const viewBtn2 = document.createElement('button');
      viewBtn2.className = 'orbit-dropdown-item';
      viewBtn2.textContent = 'View in Orbit';
      viewBtn2.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(`https://collegeorbit.app/work?task=${workItemId}`, '_blank');
        dropdown.classList.remove('show');
      });

      dropdown.appendChild(markIncompleteBtn);
      dropdown.appendChild(viewBtn2);
      break;
  }
}

// Mark work item complete/incomplete
function markWorkItem(action) {
  const btn = document.getElementById('orbit-add-btn');
  const dropdown = document.getElementById('orbit-dropdown');
  if (!btn || !currentWorkItem.id) return;

  dropdown.classList.remove('show');
  btn.textContent = action === 'complete' ? 'Completing...' : 'Updating...';
  btn.disabled = true;

  const messageType = action === 'complete' ? 'MARK_COMPLETE' : 'MARK_INCOMPLETE';

  chrome.runtime.sendMessage(
    { type: messageType, workItemId: currentWorkItem.id },
    (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        btn.textContent = 'Error — try again';
        btn.disabled = false;
        setTimeout(() => {
          updateButtonState(
            currentWorkItem.status === 'done' ? 'completed' : 'exists',
            currentWorkItem.id,
            currentWorkItem.status,
            currentWorkItem.currentData
          );
        }, 2000);
        return;
      }

      const newStatus = response.status;
      updateButtonState(
        newStatus === 'done' ? 'completed' : 'exists',
        currentWorkItem.id,
        newStatus,
        currentWorkItem.currentData
      );
    }
  );
}

// Update work item with latest scraped data
function updateWorkItem() {
  const btn = document.getElementById('orbit-add-btn');
  const dropdown = document.getElementById('orbit-dropdown');
  if (!btn || !scrapedData || !currentWorkItem.id) return;

  dropdown.classList.remove('show');
  btn.textContent = 'Updating...';
  btn.disabled = true;

  // Pass the existing work item ID so we update that specific item
  chrome.runtime.sendMessage(
    {
      type: 'ADD_ASSIGNMENT',
      data: scrapedData,
      existingWorkItemId: currentWorkItem.id,
      existingNotes: currentWorkItem.currentData?.notes || '',
      existingLinks: currentWorkItem.currentData?.links || [],
    },
    (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        btn.textContent = 'Error — try again';
        btn.disabled = false;
        setTimeout(() => {
          const data = scrapeAssignmentData();
          checkIfAlreadyAdded(data);
        }, 2000);
        return;
      }

      // Re-check to refresh state
      setTimeout(() => {
        const data = scrapeAssignmentData();
        checkIfAlreadyAdded(data);
      }, 500);
    }
  );
}

function checkIfAlreadyAdded(data) {
  const btn = document.getElementById('orbit-add-btn');
  if (!btn) return;
  if (!data?.title) {
    // Reset button if no assignment expanded
    updateButtonState('add');
    return;
  }

  // Store scraped data for update functionality
  scrapedData = data;

  chrome.runtime.sendMessage(
    { type: 'CHECK_ASSIGNMENT_EXISTS', title: data.title, canvasUrl: data.canvasUrl, lsCourseId: data.lsCourseId },
    (response) => {
      console.log('[College Orbit LS] checkIfAlreadyAdded response:', response);
      if (chrome.runtime.lastError) {
        console.log('[College Orbit LS] Runtime error:', chrome.runtime.lastError);
        return;
      }
      if (response?.exists) {
        // Skip change detection for items synced via LMS API - those are authoritative
        if (response.isSyncedViaAPI) {
          console.log('[College Orbit LS] Item synced via API, skipping change detection');
          const state = response.status === 'done' ? 'completed' : 'exists';
          updateButtonState(state, response.workItemId, response.status, response.currentData);
        } else {
          // Check if there are changes that need updating (only for extension-added items)
          const changes = detectChanges(data, response.currentData);

          if (changes) {
            console.log('[College Orbit LS] Changes detected, showing update button');
            updateButtonState('needs-update', response.workItemId, response.status, response.currentData);
          } else {
            const state = response.status === 'done' ? 'completed' : 'exists';
            console.log('[College Orbit LS] Item exists, no changes, state:', state);
            updateButtonState(state, response.workItemId, response.status, response.currentData);
          }
        }
      } else {
        console.log('[College Orbit LS] Item does not exist');
        updateButtonState('add');
      }
    }
  );
}

// Inject floating button with dropdown
function injectButton() {
  if (document.getElementById('orbit-btn-container')) return;

  // Create container
  const container = document.createElement('div');
  container.id = 'orbit-btn-container';
  container.className = 'orbit-btn-container';
  // Position bottom-right for Learning Suite
  container.style.top = 'auto';
  container.style.bottom = '24px';

  // Create main button
  const btn = document.createElement('button');
  btn.id = 'orbit-add-btn';
  btn.textContent = '+ Add to Orbit';

  // Create dropdown menu
  const dropdown = document.createElement('div');
  dropdown.id = 'orbit-dropdown';
  dropdown.className = 'orbit-dropdown';
  // Position dropdown above button on Learning Suite
  dropdown.style.top = 'auto';
  dropdown.style.bottom = '100%';
  dropdown.style.marginTop = '0';
  dropdown.style.marginBottom = '6px';

  container.appendChild(btn);
  container.appendChild(dropdown);

  // Main button click handler
  btn.addEventListener('click', (e) => {
    // If button has dropdown, toggle it
    if (btn.classList.contains('has-dropdown')) {
      e.stopPropagation();
      dropdown.classList.toggle('show');
      return;
    }

    // Otherwise, add to Orbit
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
      // Immediately update button state if we got a work item ID back
      if (response.workItemId) {
        const state = response.status === 'done' ? 'completed' : (response.updated ? 'exists' : 'added');
        updateButtonState(state, response.workItemId, response.status || 'open', null);
        scrapedData = data;
      } else {
        // Fallback: check for the item to get its ID and show dropdown
        setTimeout(() => {
          const newData = scrapeAssignmentData();
          checkIfAlreadyAdded(newData);
        }, 500);
      }
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });

  document.body.appendChild(container);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPE_ASSIGNMENT') {
    sendResponse(scrapeAssignmentData());
  }
  if (message.type === 'ASSIGNMENT_ADDED') {
    // Re-check to get the work item ID and show dropdown
    setTimeout(() => {
      const data = scrapeAssignmentData();
      checkIfAlreadyAdded(data);
    }, 500);
  }
});

function init() {
  const url = window.location.href;

  if (LS_GRADEBOOK_RE.test(url) || LS_DISCUSSION_RE.test(url) || LS_EXAM_RE.test(url)) {
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
    const container = document.getElementById('orbit-btn-container');
    if (container) container.remove();
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
