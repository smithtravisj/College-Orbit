// Popup logic
const $ = (sel) => document.querySelector(sel);

let courses = [];
let scrapedData = null;

async function init() {
  // Try cookie auth first (auto sign-in from collegeorbit.app)
  const sessionCookie = await OrbitAPI.getSessionCookie();
  if (sessionCookie) {
    const user = await OrbitAPI.fetchSessionUser();
    if (user) {
      await showMainView();
      return;
    }
  }

  // Fall back to extension token
  const token = await OrbitAPI.getToken();
  if (token) {
    await showMainView();
  } else {
    showLoginView();
  }
}

function showLoginView() {
  $('#login-view').classList.remove('hidden');
  $('#main-view').classList.add('hidden');
}

async function showMainView() {
  $('#login-view').classList.add('hidden');
  $('#main-view').classList.remove('hidden');

  const user = await OrbitAPI.getUser();
  if (user) {
    const name = user.name || user.email?.split('@')[0] || '';
    $('#user-name').textContent = name;
    $('#user-email').textContent = user.email || '';
    $('#user-avatar').textContent = (name[0] || '?').toUpperCase();
  }

  // Load courses
  try {
    const data = await OrbitAPI.fetch('/api/courses');
    courses = data.courses || [];
    populateCourses();
  } catch (e) {
    if (e.message.includes('expired')) {
      showLoginView();
      return;
    }
  }

  // Try to get scraped assignment data
  await loadScrapedData();
}

function populateCourses() {
  const sel = $('#add-course');
  sel.innerHTML = '<option value="">-- No course --</option>';
  courses.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.code ? `${c.code} - ${c.name}` : c.name;
    opt.dataset.name = (c.name || '').toLowerCase();
    opt.dataset.code = (c.code || '').toLowerCase();
    sel.appendChild(opt);
  });
}

async function loadScrapedData() {
  // First try messaging the content script via background
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_ASSIGNMENT_DATA' }, (resp) => {
        // Suppress "Receiving end does not exist" error
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(resp);
        }
      });
    });
    if (response) {
      scrapedData = response;
    }
  } catch {
    // Content script might not be loaded
  }

  // Fallback to storage
  if (!scrapedData) {
    const result = await chrome.storage.local.get('orbit_scraped');
    scrapedData = result.orbit_scraped || null;
  }

  if (scrapedData) {
    $('#no-assignment').classList.add('hidden');
    $('#add-form').classList.remove('hidden');
    const sourceName = scrapedData.source === 'learningsuite' ? 'Learning Suite' : 'Canvas';
    $('#detected-label').textContent = `Detected from ${sourceName}`;
    $('#scraped-title').textContent = scrapedData.title || 'Assignment';
    const metaParts = [];
    if (scrapedData.courseName) metaParts.push(scrapedData.courseName);
    if (scrapedData.points) metaParts.push(`${scrapedData.points} pts`);
    $('#scraped-meta').textContent = metaParts.join(' · ') || '';
    $('#add-title').value = scrapedData.title || '';

    // Auto-fill notes with Canvas description (same format as Canvas sync)
    const desc = (scrapedData.description || '').trim();
    if (desc) {
      const source = scrapedData.source === 'learningsuite' ? 'Learning Suite' : 'Canvas';
      $('#add-notes').value = `─── Your Notes ───\n\n\n─── From ${source} ───\n${desc}`;
    }

    if (scrapedData.dueDate) {
      const d = new Date(scrapedData.dueDate);
      // Format for datetime-local input
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      $('#add-due').value = local;
    }

    // Check if already added (by Canvas URL in links, canvasAssignmentId, or exact title match)
    try {
      const data = await OrbitAPI.fetch('/api/work');
      const items = data.workItems || [];
      const url = scrapedData.canvasUrl;
      const assignmentId = scrapedData.canvasAssignmentId;
      const scrapedTitle = (scrapedData.title || '').toLowerCase().trim();

      const exists = items.some((w) => {
        // Check links for Canvas URL
        if (url && (w.links || []).some((l) => l.url && l.url.includes(assignmentId))) return true;
        // Check canvasAssignmentId field
        if (assignmentId && w.canvasAssignmentId === assignmentId) return true;
        if (assignmentId && w.canvasAssignmentId === String(assignmentId)) return true;
        // Check title match (exact or one contains the other, to handle prefix stripping)
        if (scrapedTitle) {
          const wTitle = (w.title || '').toLowerCase().trim();
          if (wTitle === scrapedTitle) return true;
          if (wTitle && (wTitle.includes(scrapedTitle) || scrapedTitle.includes(wTitle))) return true;
        }
        return false;
      });
      if (exists) {
        $('#already-added').classList.remove('hidden');
      }
    } catch {
      // Ignore - just skip duplicate check
    }

    // Auto-match course
    if (scrapedData.courseName && courses.length) {
      const name = scrapedData.courseName.toLowerCase();
      const match = courses.find(
        (c) =>
          (c.name || '').toLowerCase().includes(name) ||
          name.includes((c.name || '').toLowerCase()) ||
          (c.code || '').toLowerCase().includes(name) ||
          name.includes((c.code || '').toLowerCase())
      );
      if (match) {
        $('#add-course').value = match.id;
      }
    }
  } else {
    $('#no-assignment').classList.remove('hidden');
    $('#add-form').classList.add('hidden');
  }
}

// Login
$('#login-btn').addEventListener('click', async () => {
  const email = $('#login-email').value.trim();
  const password = $('#login-password').value;
  const errEl = $('#login-error');
  errEl.style.display = 'none';

  if (!email || !password) {
    errEl.textContent = 'Please enter email and password.';
    errEl.style.display = 'block';
    return;
  }

  $('#login-btn').disabled = true;
  $('#login-btn').textContent = 'Signing in...';

  try {
    await OrbitAPI.login(email, password);
    await showMainView();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
  } finally {
    $('#login-btn').disabled = false;
    $('#login-btn').textContent = 'Sign In';
  }
});

// Allow Enter key to submit login
$('#login-password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('#login-btn').click();
});

// Logout
$('#logout-btn').addEventListener('click', async () => {
  await OrbitAPI.clearAuth();
  await chrome.storage.local.remove('orbit_scraped');
  showLoginView();
});

// Submit
$('#add-btn').addEventListener('click', async () => {
  const errEl = $('#add-error');
  const successEl = $('#add-success');
  errEl.style.display = 'none';
  successEl.style.display = 'none';

  const title = $('#add-title').value.trim();
  if (!title) {
    errEl.textContent = 'Title is required.';
    errEl.style.display = 'block';
    return;
  }

  const dueValue = $('#add-due').value;
  const dueAt = dueValue ? new Date(dueValue).toISOString() : null;
  const courseId = $('#add-course').value || null;
  const priority = $('#add-priority').value || null;
  const notes = $('#add-notes').value.trim();

  const linkLabel = scrapedData?.source === 'learningsuite' ? 'Learning Suite' : 'Canvas';
  const links = [];
  if (scrapedData?.canvasUrl) links.push({ label: linkLabel, url: scrapedData.canvasUrl });
  if (scrapedData?.discussionUrl) links.push({ label: 'Discussion', url: scrapedData.discussionUrl });

  const body = { title, dueAt, courseId, priority, notes, links, type: 'assignment' };

  $('#add-btn').disabled = true;
  $('#add-btn').textContent = 'Adding...';

  try {
    await OrbitAPI.fetch('/api/work', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // Notify the content script to update the Canvas button
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'ASSIGNMENT_ADDED' }, () => {
          if (chrome.runtime.lastError) { /* ignore */ }
        });
      }
    });

    // Show success state, hide form fields
    $('#success-title').textContent = `"${title}" added to your work!`;
    successEl.classList.remove('hidden');
    // Hide the form inputs
    for (const el of document.querySelectorAll('#add-form .form-group, #add-form .section-label, #add-form .btn-primary, #scraped-preview, #already-added')) {
      el.classList.add('hidden');
    }

    // Clear scraped data
    await chrome.storage.local.remove('orbit_scraped');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
    $('#add-btn').disabled = false;
    $('#add-btn').textContent = 'Add to College Orbit';
  }
});

init();
