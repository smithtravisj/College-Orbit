// Canvas content script - scrapes assignment data and injects button

// Match assignment, discussion, and quiz pages
const CANVAS_PAGE_RE = /\/courses\/(\d+)\/(assignments|discussion_topics|quizzes)\/(\d+)/;

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
      dueDate = formatLocalISO(parsed);
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
          dueDate = formatLocalISO(parsed);
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
        dueDate = formatLocalISO(parsed);
      }
    }
  }

  // 3. Try broader selectors
  if (!dueDate) {
    const dateEls = document.querySelectorAll('.date_text, .assignment-date-due, .due_date_display, [data-testid="assignment-due-date"]');
    for (const el of dateEls) {
      const parsed = parseCanvasDate(el.textContent?.trim());
      if (parsed) {
        dueDate = formatLocalISO(parsed);
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
        dueDate = formatLocalISO(parsed);
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
  if (scraped.dueDate && stored.dueAt) {
    const scrapedDate = new Date(scraped.dueDate).getTime();
    const storedDate = new Date(stored.dueAt).getTime();
    if (Math.abs(scrapedDate - storedDate) > 60000) {
      changes.push('due date');
    }
  } else if (scraped.dueDate && !stored.dueAt) {
    changes.push('due date');
  }

  // Check if Canvas/LS link exists
  const sourceLabel = scraped.source === 'learningsuite' ? 'Learning Suite' : 'Canvas';
  const hasSourceLink = (stored.links || []).some(l => l.label === sourceLabel);
  if (scraped.canvasUrl && !hasSourceLink) {
    changes.push('link');
  }

  // Check description - only if scraped has description and stored doesn't have LMS section
  if (scraped.description) {
    const lmsSectionExists = (stored.notes || '').includes(`─── From ${sourceLabel} ───`);
    if (!lmsSectionExists) {
      changes.push('description');
    }
  }

  console.log('[College Orbit] Detected changes:', changes);
  return changes.length > 0 ? changes : false;
}

// Inject floating "Add to College Orbit" button with dropdown
function injectButton() {
  if (document.getElementById('orbit-btn-container')) return;

  // Create container
  const container = document.createElement('div');
  container.id = 'orbit-btn-container';
  container.className = 'orbit-btn-container';

  // Create main button
  const btn = document.createElement('button');
  btn.id = 'orbit-add-btn';
  btn.textContent = '+ Add to Orbit';

  // Create dropdown menu
  const dropdown = document.createElement('div');
  dropdown.id = 'orbit-dropdown';
  dropdown.className = 'orbit-dropdown';

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
    const data = scrapeAssignment();
    if (!data) return;
    chrome.storage.local.set({ orbit_scraped: data });

    btn.textContent = 'Adding...';
    btn.disabled = true;

    chrome.runtime.sendMessage({ type: 'ADD_ASSIGNMENT', data }, (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        btn.textContent = 'Error — use extension icon';
        btn.disabled = false;
        setTimeout(() => { btn.textContent = '+ Add to Orbit'; }, 3000);
        return;
      }
      // After adding, check for the item to get its ID and show dropdown
      setTimeout(() => checkIfAlreadyAdded(), 500);
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

// Update button state and dropdown options
function updateButtonState(state, workItemId = null, workItemStatus = null, currentData = null) {
  console.log('[College Orbit] updateButtonState called with:', { state, workItemId, workItemStatus });
  const btn = document.getElementById('orbit-add-btn');
  const dropdown = document.getElementById('orbit-dropdown');
  if (!btn || !dropdown) {
    console.log('[College Orbit] Button or dropdown not found!', { btn: !!btn, dropdown: !!dropdown });
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
        // Show as "In Orbit" without update indicator
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

      // Update to new state
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
        setTimeout(() => checkIfAlreadyAdded(), 2000);
        return;
      }

      // Re-check to refresh state
      setTimeout(() => checkIfAlreadyAdded(), 500);
    }
  );
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPE_ASSIGNMENT') {
    sendResponse(scrapeAssignment());
  }
  if (message.type === 'ASSIGNMENT_ADDED') {
    // Re-check to get the work item ID and show dropdown
    setTimeout(() => checkIfAlreadyAdded(), 500);
  }
});

// Check if this assignment is already in Orbit and update button accordingly
async function checkIfAlreadyAdded() {
  const btn = document.getElementById('orbit-add-btn');
  if (!btn) return;

  try {
    const data = scrapeAssignment();
    if (!data) return;

    // Store scraped data for update functionality
    scrapedData = data;

    // Ask background script to check (it has access to cookies + storage)
    console.log('[College Orbit] Checking if exists:', { assignmentId: data.canvasAssignmentId, title: data.title, canvasUrl: data.canvasUrl });
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'CHECK_ASSIGNMENT_EXISTS', assignmentId: data.canvasAssignmentId, title: data.title, canvasUrl: data.canvasUrl.split('?')[0] },
        (resp) => {
          console.log('[College Orbit] Check response:', resp, 'lastError:', chrome.runtime.lastError?.message);
          if (chrome.runtime.lastError) { resolve({ exists: false }); return; }
          resolve(resp || { exists: false });
        }
      );
    });
    console.log('[College Orbit] Exists result:', response);

    console.log('[College Orbit] checkIfAlreadyAdded response:', response);
    if (response.exists) {
      // Skip change detection for items synced via Canvas/LMS API - those are authoritative
      if (response.isSyncedViaAPI) {
        console.log('[College Orbit] Item synced via API, skipping change detection');
        const state = response.status === 'done' ? 'completed' : 'exists';
        updateButtonState(state, response.workItemId, response.status, response.currentData);
      } else {
        // Check if there are changes that need updating (only for extension-added items)
        const changes = detectChanges(data, response.currentData);

        if (changes) {
          console.log('[College Orbit] Changes detected, showing update button');
          updateButtonState('needs-update', response.workItemId, response.status, response.currentData);
        } else {
          const state = response.status === 'done' ? 'completed' : 'exists';
          console.log('[College Orbit] Item exists, no changes, state:', state);
          updateButtonState(state, response.workItemId, response.status, response.currentData);
        }
      }
    } else {
      console.log('[College Orbit] Item does not exist, setting to add');
      updateButtonState('add');
    }
  } catch {
    // Silently fail
  }
}

// Reset button to default state
function resetButton() {
  updateButtonState('add');
  const dropdown = document.getElementById('orbit-dropdown');
  if (dropdown) dropdown.classList.remove('show');
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
      // Not a supported page, remove button container and clear data
      const container = document.getElementById('orbit-btn-container');
      if (container) container.remove();
      chrome.storage.local.remove('orbit_scraped');
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });
