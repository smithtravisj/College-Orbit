// Canvas content script - scrapes assignment data and injects button

// Match assignment, discussion, and quiz pages
const CANVAS_PAGE_RE = /\/courses\/(\d+)\/(assignments|discussion_topics|quizzes)\/(\d+)/;

function scrapeAssignment() {
  const url = window.location.href;
  const match = url.match(CANVAS_PAGE_RE);
  if (!match) return null;
  const courseId = match[1];
  const pageType = match[2]; // assignments, discussion_topics, quizzes
  const itemId = match[3];

  const title = document.querySelector('h1.title, .assignment-title h2, h1')?.textContent?.trim() || '';

  // Due date from various Canvas layouts
  let dueDate = null;

  // Helper: parse a date string, adding current/next year if missing
  // Defaults to 11:59 PM if no time is specified
  function parseCanvasDate(text) {
    if (!text) return null;

    // Extract time portion if present (e.g. "at 11:59pm", "11:59 PM")
    const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/);
    let hours = 23, minutes = 59; // Default to 11:59 PM
    let hasTime = false;
    if (timeMatch) {
      hasTime = true;
      hours = parseInt(timeMatch[1]);
      minutes = parseInt(timeMatch[2]);
      const ampm = timeMatch[3].toLowerCase();
      if (ampm === 'pm' && hours !== 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
    }

    // Strip time portion for date-only parsing
    const dateOnly = text.replace(/\s*(at\s+)?\d{1,2}:\d{2}\s*(am|pm|AM|PM)/i, '').trim();

    const now = new Date();

    // Try parsing with year included
    let parsed = new Date(dateOnly);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2024) {
      parsed.setHours(hours, minutes, 0, 0);
      return parsed;
    }

    // Canvas often shows "Mar 18" without year — append current year
    const withYear = dateOnly + ', ' + now.getFullYear();
    parsed = new Date(withYear);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2024) {
      // If more than 2 months in the past, assume next year
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      parsed.setHours(hours, minutes, 0, 0);
      if (parsed < twoMonthsAgo) {
        parsed = new Date(dateOnly + ', ' + (now.getFullYear() + 1));
        parsed.setHours(hours, minutes, 0, 0);
      }
      return parsed;
    }

    // Try "Month Day Year" format
    const withYear2 = dateOnly + ' ' + now.getFullYear();
    parsed = new Date(withYear2);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2024) {
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      parsed.setHours(hours, minutes, 0, 0);
      if (parsed < twoMonthsAgo) {
        parsed = new Date(dateOnly + ' ' + (now.getFullYear() + 1));
        parsed.setHours(hours, minutes, 0, 0);
      }
      return parsed;
    }

    return null;
  }

  // 1. Try <time> elements with datetime attribute
  const allTimeEls = document.querySelectorAll('time[datetime]');
  for (const el of allTimeEls) {
    const dt = el.getAttribute('datetime');
    const parsed = parseCanvasDate(dt);
    if (parsed) {
      dueDate = parsed.toISOString();
      break;
    }
  }

  // 2. Try .display_date spans (Canvas shows "Mar 18" etc.)
  //    Also grab full container text which may include time like "Due Mar 18 at 11:59pm"
  if (!dueDate) {
    const displayDateEls = document.querySelectorAll('.display_date');
    for (const el of displayDateEls) {
      const container = el.closest('.date_text, .assignment_dates, .details') || el.parentElement;
      const containerText = (container?.textContent || '').trim();
      const containerLower = containerText.toLowerCase();
      if (containerLower.includes('due')) {
        // Use full container text so we get "Mar 18 at 11:59pm" not just "Mar 18"
        const parsed = parseCanvasDate(containerText.replace(/^[^A-Z]*(Due|due)[:\s]*/i, ''));
        if (parsed) {
          dueDate = parsed.toISOString();
          break;
        }
      }
    }
    // If no "due" context found, try first display_date with container text
    if (!dueDate && displayDateEls.length > 0) {
      const container = displayDateEls[0].closest('.date_text, .assignment_dates, .details') || displayDateEls[0].parentElement;
      const fullText = (container?.textContent || displayDateEls[0].textContent || '').trim();
      const parsed = parseCanvasDate(fullText.replace(/^[^A-Z]*(Due|due)[:\s]*/i, ''));
      if (parsed) {
        dueDate = parsed.toISOString();
      }
    }
  }

  // 3. Try broader selectors
  if (!dueDate) {
    const dateEls = document.querySelectorAll('.date_text, .assignment-date-due, .due_date_display, [data-testid="assignment-due-date"]');
    for (const el of dateEls) {
      const parsed = parseCanvasDate(el.textContent?.trim());
      if (parsed) {
        dueDate = parsed.toISOString();
        break;
      }
    }
  }

  // 4. Scan page text for "Due <date>" patterns
  if (!dueDate) {
    const body = document.body.innerText || '';
    const dateMatch = body.match(/[Dd]ue[:\s]+([A-Z][a-z]+ \d{1,2}(?:,?\s*\d{4})?(?:\s+(?:at\s+)?\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))?)/);
    if (dateMatch) {
      const parsed = parseCanvasDate(dateMatch[1]);
      if (parsed) {
        dueDate = parsed.toISOString();
      }
    }
  }

  console.log('[College Orbit] Scraped due date:', dueDate);

  // Points
  let points = null;
  const pointsEl = document.querySelector('.points_possible, [data-testid="assignment-points"]');
  if (pointsEl) {
    const num = parseFloat(pointsEl.textContent);
    if (!isNaN(num)) points = num;
  }

  // Assignment/discussion/quiz description
  const descSelectors = [
    '.description.user_content',
    '#assignment_description .user_content',
    '.assignment-description',
    '.discussion-entry-message',
    '.message.user_content',
    '#discussion_topic .user_content',
    '.discussion-section .user_content',
    '.entry-content',
    '#quiz_description .user_content',
    '.quiz-description',
    '.show-content.user_content',
    '#content .user_content',
    '.user_content',
  ];
  let description = '';
  for (const sel of descSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText?.trim()) {
      description = el.innerText.trim();
      console.log('[College Orbit] Description matched selector:', sel);
      break;
    }
  }

  console.log('[College Orbit] Scraped description:', description ? description.substring(0, 100) + '...' : '(empty)');

  // Course name from breadcrumb
  const courseName =
    document.querySelector('#breadcrumbs li:nth-child(2) a span')?.textContent?.trim() ||
    document.querySelector('.mobile-header-title a')?.textContent?.trim() ||
    '';

  return {
    title,
    dueDate,
    points,
    description,
    courseName,
    canvasCourseId: courseId,
    canvasAssignmentId: itemId,
    canvasPageType: pageType,
    canvasUrl: url.split('?')[0],
  };
}

// Inject floating "Add to College Orbit" button
function injectButton() {
  if (document.getElementById('orbit-add-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'orbit-add-btn';
  btn.textContent = '+ Add to Orbit';
  btn.addEventListener('click', () => {
    const data = scrapeAssignment();
    if (!data) return;
    // Store scraped data for the popup to read
    chrome.storage.local.set({ orbit_scraped: data });

    btn.textContent = 'Adding...';
    btn.disabled = true;

    // Ask background script to add directly
    chrome.runtime.sendMessage({ type: 'ADD_ASSIGNMENT', data }, (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        // Fallback: tell user to use popup
        btn.textContent = 'Error — use extension icon';
        btn.disabled = false;
        setTimeout(() => { btn.textContent = '+ Add to Orbit'; }, 3000);
        return;
      }
      btn.textContent = '\u2713 Added to Orbit';
      btn.classList.add('orbit-added');
      btn.onclick = () => window.open('https://collegeorbit.app/work', '_blank');
    });
  });

  document.body.appendChild(btn);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPE_ASSIGNMENT') {
    sendResponse(scrapeAssignment());
  }
  if (message.type === 'ASSIGNMENT_ADDED') {
    const btn = document.getElementById('orbit-add-btn');
    if (btn) {
      btn.textContent = '\u2713 Added to Orbit';
      btn.classList.add('orbit-added');
      btn.disabled = true;
    }
  }
});

// Check if this assignment is already in Orbit and update button accordingly
async function checkIfAlreadyAdded() {
  const btn = document.getElementById('orbit-add-btn');
  if (!btn) return;

  try {
    const data = scrapeAssignment();
    if (!data) return;

    // Ask background script to check (it has access to cookies + storage)
    console.log('[College Orbit] Checking if exists:', { assignmentId: data.canvasAssignmentId, title: data.title, canvasUrl: data.canvasUrl });
    const exists = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'CHECK_ASSIGNMENT_EXISTS', assignmentId: data.canvasAssignmentId, title: data.title, canvasUrl: data.canvasUrl.split('?')[0] },
        (response) => {
          console.log('[College Orbit] Check response:', response, 'lastError:', chrome.runtime.lastError?.message);
          if (chrome.runtime.lastError) { resolve(false); return; }
          resolve(response?.exists || false);
        }
      );
    });
    console.log('[College Orbit] Exists result:', exists);

    if (exists) {
      btn.textContent = '\u2713 Already in Orbit';
      btn.classList.add('orbit-added');
      btn.onclick = () => {
        window.open('https://collegeorbit.app/work', '_blank');
      };
    }
  } catch {
    // Silently fail
  }
}

// Reset button to default state
function resetButton() {
  const btn = document.getElementById('orbit-add-btn');
  if (btn) {
    btn.textContent = '+ Add to Orbit';
    btn.classList.remove('orbit-added');
    btn.disabled = false;
  }
}

// Run on assignment page
function onAssignmentPage() {
  injectButton();
  resetButton();
  // Store fresh scrape for popup
  const data = scrapeAssignment();
  if (data) {
    chrome.storage.local.set({ orbit_scraped: data });
  }
  checkIfAlreadyAdded();

  // Retry after delay — Canvas React content (title, description) may not be loaded yet
  setTimeout(() => {
    const retryData = scrapeAssignment();
    if (retryData) {
      chrome.storage.local.set({ orbit_scraped: retryData });
      // Re-check duplicates now that title is available
      if (retryData.title) {
        checkIfAlreadyAdded();
      }
    }
  }, 2000);
}

// Initial run
if (CANVAS_PAGE_RE.test(window.location.href)) {
  onAssignmentPage();
} else {
  // Not a supported page, clear any stale scraped data
  chrome.storage.local.remove('orbit_scraped');
}

// Watch for Canvas SPA navigation (URL changes without full page reload)
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    if (CANVAS_PAGE_RE.test(lastUrl)) {
      // Delay to let Canvas render the new page content
      setTimeout(onAssignmentPage, 1000);
    } else {
      // Not a supported page, remove button and clear data
      const btn = document.getElementById('orbit-add-btn');
      if (btn) btn.remove();
      chrome.storage.local.remove('orbit_scraped');
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });
