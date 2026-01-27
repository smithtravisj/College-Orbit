importScripts('../lib/api.js');

// Show badge on Canvas assignment pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isAssignment = /instructure\.com\/courses\/\d+\/(assignments|discussion_topics|quizzes)\/\d+/.test(tab.url) ||
      /learningsuite\.byu\.edu\/.*\/student\/(gradebook|discuss)/.test(tab.url);
    chrome.action.setBadgeText({
      tabId,
      text: isAssignment ? '+' : '',
    });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#6366f1' });
  }
});

// Relay messages between content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_ASSIGNMENT_DATA') {
    // Forward to the active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SCRAPE_ASSIGNMENT' }, (response) => {
          if (chrome.runtime.lastError) {
            sendResponse(null);
          } else {
            sendResponse(response || null);
          }
        });
      } else {
        sendResponse(null);
      }
    });
    return true;
  }

  if (message.type === 'CHECK_ASSIGNMENT_EXISTS') {
    (async () => {
      try {
        const data = await OrbitAPI.fetch('/api/work');
        const items = data.workItems || [];
        const assignmentId = message.assignmentId;
        const canvasUrl = message.canvasUrl || '';
        const title = (message.title || '').toLowerCase().trim();

        const exists = items.some((w) => {
          // Check links for matching URL (strip query params for comparison)
          const linkUrls = (w.links || []).map((l) => (l.url || '').split('?')[0]);
          if (canvasUrl && linkUrls.some((u) => u === canvasUrl)) return true;
          if (assignmentId && linkUrls.some((u) => u.includes(assignmentId))) return true;
          // Check canvasAssignmentId field
          if (assignmentId && (w.canvasAssignmentId === assignmentId || w.canvasAssignmentId === String(assignmentId))) return true;
          // Check title match (exact or substring to handle prefix stripping)
          if (title) {
            const wTitle = (w.title || '').toLowerCase().trim();
            if (wTitle === title) return true;
            if (wTitle && (wTitle.includes(title) || title.includes(wTitle))) return true;
          }
          return false;
        });

        sendResponse({ exists });
      } catch {
        sendResponse({ exists: false });
      }
    })();
    return true;
  }

  if (message.type === 'ADD_ASSIGNMENT') {
    (async () => {
      try {
        const d = message.data;
        const body = {
          title: d.title,
          dueAt: d.dueDate || null,
          notes: d.description ? `─── Your Notes ───\n\n\n─── From ${d.source === 'learningsuite' ? 'Learning Suite' : 'Canvas'} ───\n${d.description}` : '',
          links: [
            ...(d.canvasUrl ? [{ label: d.source === 'learningsuite' ? 'Learning Suite' : 'Canvas', url: d.canvasUrl }] : []),
            ...(d.discussionUrl ? [{ label: 'Discussion', url: d.discussionUrl }] : []),
          ],
          type: 'assignment',
        };

        // Try to auto-match course
        try {
          const courseData = await OrbitAPI.fetch('/api/courses');
          const courses = courseData.courses || [];
          if (d.courseName && courses.length) {
            const name = d.courseName.toLowerCase();
            const match = courses.find(
              (c) =>
                (c.name || '').toLowerCase().includes(name) ||
                name.includes((c.name || '').toLowerCase()) ||
                (c.code || '').toLowerCase().includes(name) ||
                name.includes((c.code || '').toLowerCase())
            );
            if (match) body.courseId = match.id;
          }
        } catch {}

        await OrbitAPI.fetch('/api/work', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        sendResponse({ success: true });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }
});
