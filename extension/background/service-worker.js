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

        let foundItem = null;
        for (const w of items) {
          // Check links for matching URL (strip query params for comparison)
          const linkUrls = (w.links || []).map((l) => (l.url || '').split('?')[0]);
          if (canvasUrl && linkUrls.some((u) => u === canvasUrl)) { foundItem = w; break; }
          if (assignmentId && linkUrls.some((u) => u.includes(assignmentId))) { foundItem = w; break; }
          // Check canvasAssignmentId field
          if (assignmentId && (w.canvasAssignmentId === assignmentId || w.canvasAssignmentId === String(assignmentId))) { foundItem = w; break; }
          // Check title match - EXACT match only to avoid false positives
          if (title) {
            const wTitle = (w.title || '').toLowerCase().trim();
            if (wTitle === title) { foundItem = w; break; }
          }
        }

        if (foundItem) {
          console.log('[College Orbit SW] Found item:', { id: foundItem.id, status: foundItem.status, title: foundItem.title });
          // Check if item was synced via LMS API (has canvasAssignmentId, blackboardColumnId, etc.)
          const isSyncedViaAPI = !!(foundItem.canvasAssignmentId || foundItem.blackboardColumnId || foundItem.moodleAssignmentId || foundItem.brightspaceActivityId);
          sendResponse({
            exists: true,
            workItemId: foundItem.id,
            status: foundItem.status,
            isSyncedViaAPI,
            // Return current data for comparison
            currentData: {
              title: foundItem.title || '',
              dueAt: foundItem.dueAt || null,
              notes: foundItem.notes || '',
              links: foundItem.links || [],
            },
          });
        } else {
          console.log('[College Orbit SW] Item not found');
          sendResponse({ exists: false });
        }
      } catch {
        sendResponse({ exists: false });
      }
    })();
    return true;
  }

  if (message.type === 'MARK_COMPLETE' || message.type === 'MARK_INCOMPLETE') {
    (async () => {
      try {
        const newStatus = message.type === 'MARK_COMPLETE' ? 'done' : 'open';
        await OrbitAPI.fetch(`/api/work/${message.workItemId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus }),
        });
        sendResponse({ success: true, status: newStatus });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }

  if (message.type === 'UPDATE_ASSIGNMENT') {
    (async () => {
      try {
        const d = message.data;
        const workItemId = message.workItemId;
        const currentNotes = message.currentNotes || '';

        // Build updated notes - preserve user notes section, update LMS section
        let notes = currentNotes;
        const sourceLabel = d.source === 'learningsuite' ? 'Learning Suite' : 'Canvas';
        const lmsSectionRegex = new RegExp(`─── From (Canvas|Learning Suite) ───[\\s\\S]*$`);

        if (d.description) {
          const newLmsSection = `─── From ${sourceLabel} ───\n${d.description}`;
          if (lmsSectionRegex.test(notes)) {
            // Replace existing LMS section
            notes = notes.replace(lmsSectionRegex, newLmsSection);
          } else if (notes.includes('─── Your Notes ───')) {
            // Append after user notes
            notes = notes + '\n\n' + newLmsSection;
          } else {
            // Create new structure
            notes = `─── Your Notes ───\n${notes}\n\n${newLmsSection}`;
          }
        }

        // Build links array - merge existing non-LMS links with new LMS links
        const existingLinks = message.currentLinks || [];
        const nonLmsLinks = existingLinks.filter(l => l.label !== 'Canvas' && l.label !== 'Learning Suite' && l.label !== 'Discussion');
        const newLinks = [
          ...nonLmsLinks,
          ...(d.canvasUrl ? [{ label: sourceLabel, url: d.canvasUrl }] : []),
          ...(d.discussionUrl ? [{ label: 'Discussion', url: d.discussionUrl }] : []),
        ];

        const body = {
          title: d.title,
          dueAt: d.dueDate || null,
          notes,
          links: newLinks,
        };

        await OrbitAPI.fetch(`/api/work/${workItemId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });

        sendResponse({ success: true });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }

  if (message.type === 'ADD_ASSIGNMENT') {
    (async () => {
      try {
        const d = message.data;
        const sourceLabel = d.source === 'learningsuite' ? 'Learning Suite' : 'Canvas';

        // If we're given an existing work item ID, update it directly
        // This happens when user clicks "Update Now" from the dropdown
        if (message.existingWorkItemId) {
          console.log('[College Orbit SW] Updating existing item directly:', message.existingWorkItemId);

          // Build updated notes - preserve user notes section
          let notes = message.existingNotes || '';
          const lmsSectionRegex = new RegExp(`─── From (Canvas|Learning Suite) ───[\\s\\S]*$`);

          if (d.description) {
            const newLmsSection = `─── From ${sourceLabel} ───\n${d.description}`;
            if (lmsSectionRegex.test(notes)) {
              notes = notes.replace(lmsSectionRegex, newLmsSection);
            } else if (notes.includes('─── Your Notes ───')) {
              notes = notes + '\n\n' + newLmsSection;
            } else if (notes.trim()) {
              notes = `─── Your Notes ───\n${notes}\n\n${newLmsSection}`;
            } else {
              notes = `─── Your Notes ───\n\n\n${newLmsSection}`;
            }
          } else {
            // No new description, keep existing notes as-is
          }

          // Only update title, due date, and notes
          // Don't touch links - user can manage those manually
          await OrbitAPI.fetch(`/api/work/${message.existingWorkItemId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              title: d.title,
              dueAt: d.dueDate || null,
              notes,
            }),
          });

          sendResponse({ success: true, updated: true });
          return;
        }

        // Otherwise, check if this assignment already exists to prevent duplicates
        const existingData = await OrbitAPI.fetch('/api/work');
        const existingItems = existingData.workItems || [];
        const canvasUrl = (d.canvasUrl || '').split('?')[0];
        const title = (d.title || '').toLowerCase().trim();

        let existingItem = null;
        for (const w of existingItems) {
          const linkUrls = (w.links || []).map((l) => (l.url || '').split('?')[0]);
          // Check by URL
          if (canvasUrl && linkUrls.some((u) => u === canvasUrl)) { existingItem = w; break; }
          // Check by assignment ID in URL
          if (d.canvasAssignmentId && linkUrls.some((u) => u.includes(d.canvasAssignmentId))) { existingItem = w; break; }
          // Check by canvasAssignmentId field
          if (d.canvasAssignmentId && (w.canvasAssignmentId === d.canvasAssignmentId || w.canvasAssignmentId === String(d.canvasAssignmentId))) { existingItem = w; break; }
          // Check by exact title match
          if (title) {
            const wTitle = (w.title || '').toLowerCase().trim();
            if (wTitle === title) { existingItem = w; break; }
          }
        }

        // If item already exists, update it instead of creating a duplicate
        if (existingItem) {
          console.log('[College Orbit SW] Item already exists, updating instead of creating duplicate:', existingItem.id);

          // Build updated notes - preserve user notes section
          let notes = existingItem.notes || '';
          const lmsSectionRegex = new RegExp(`─── From (Canvas|Learning Suite) ───[\\s\\S]*$`);

          if (d.description) {
            const newLmsSection = `─── From ${sourceLabel} ───\n${d.description}`;
            if (lmsSectionRegex.test(notes)) {
              notes = notes.replace(lmsSectionRegex, newLmsSection);
            } else if (notes.includes('─── Your Notes ───')) {
              notes = notes + '\n\n' + newLmsSection;
            } else if (notes.trim()) {
              notes = `─── Your Notes ───\n${notes}\n\n${newLmsSection}`;
            } else {
              notes = `─── Your Notes ───\n\n\n${newLmsSection}`;
            }
          }

          // Merge links - preserve non-LMS links
          const existingLinks = existingItem.links || [];
          const nonLmsLinks = existingLinks.filter(l => l.label !== 'Canvas' && l.label !== 'Learning Suite' && l.label !== 'Discussion');
          const newLinks = [
            ...nonLmsLinks,
            ...(d.canvasUrl ? [{ label: sourceLabel, url: d.canvasUrl }] : []),
            ...(d.discussionUrl ? [{ label: 'Discussion', url: d.discussionUrl }] : []),
          ];

          await OrbitAPI.fetch(`/api/work/${existingItem.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              title: d.title,
              dueAt: d.dueDate || null,
              notes,
              links: newLinks,
            }),
          });

          sendResponse({ success: true, updated: true });
          return;
        }

        // Item doesn't exist, create new one
        const body = {
          title: d.title,
          dueAt: d.dueDate || null,
          notes: d.description ? `─── Your Notes ───\n\n\n─── From ${sourceLabel} ───\n${d.description}` : '',
          links: [
            ...(d.canvasUrl ? [{ label: sourceLabel, url: d.canvasUrl }] : []),
            ...(d.discussionUrl ? [{ label: 'Discussion', url: d.discussionUrl }] : []),
          ],
          type: 'assignment',
          canvasAssignmentId: d.canvasAssignmentId || null,
        };

        // Try to auto-match course or create it
        try {
          const courseData = await OrbitAPI.fetch('/api/courses');
          const courses = courseData.courses || [];

          if (d.courseName) {
            const name = d.courseName.toLowerCase();

            // For Learning Suite, also check by lsCourseId
            let match = null;
            if (d.source === 'learningsuite' && d.lsCourseId) {
              match = courses.find((c) => c.learningSuiteCourseId === d.lsCourseId);
            }

            // If not found by ID, try name matching
            if (!match) {
              match = courses.find(
                (c) =>
                  (c.name || '').toLowerCase().includes(name) ||
                  name.includes((c.name || '').toLowerCase()) ||
                  (c.code || '').toLowerCase().includes(name) ||
                  name.includes((c.code || '').toLowerCase())
              );
            }

            if (match) {
              body.courseId = match.id;
            } else if (d.courseName) {
              // Auto-create course for Learning Suite or Canvas
              const isLearningsuite = d.source === 'learningsuite';
              console.log(`[College Orbit SW] Creating new course for ${isLearningsuite ? 'Learning Suite' : 'Canvas'}:`, d.courseName);

              // Parse course name - usually "CODE 123 - Course Name" or "CODE 123"
              const courseNameParts = d.courseName.match(/^([A-Z]{2,5}\s*\d{3}\S*)\s*[-–]?\s*(.*)$/i);
              const code = courseNameParts ? courseNameParts[1].trim() : d.courseName;
              const courseName = courseNameParts && courseNameParts[2] ? courseNameParts[2].trim() : '';

              // Get current term (e.g., "Winter 2026")
              const now = new Date();
              const month = now.getMonth();
              let term;
              if (month >= 0 && month <= 3) term = 'Winter';
              else if (month >= 4 && month <= 5) term = 'Spring';
              else if (month >= 6 && month <= 7) term = 'Summer';
              else term = 'Fall';
              term += ' ' + now.getFullYear();

              // Build course links based on source
              const courseLinks = [];
              if (isLearningsuite && d.lsCourseId) {
                courseLinks.push({ label: 'Learning Suite', url: `https://learningsuite.byu.edu/cid-${d.lsCourseId}/student/top` });
              } else if (!isLearningsuite && d.canvasCourseId) {
                // Extract Canvas domain from the assignment URL
                const canvasDomain = d.canvasUrl ? new URL(d.canvasUrl).origin : 'https://canvas.instructure.com';
                courseLinks.push({ label: 'Canvas', url: `${canvasDomain}/courses/${d.canvasCourseId}` });
              }

              try {
                const newCourse = await OrbitAPI.fetch('/api/courses', {
                  method: 'POST',
                  body: JSON.stringify({
                    code,
                    name: courseName,
                    term,
                    learningSuiteCourseId: isLearningsuite ? (d.lsCourseId || null) : null,
                    links: courseLinks,
                  }),
                });
                if (newCourse.course?.id) {
                  body.courseId = newCourse.course.id;
                  console.log('[College Orbit SW] Created course:', newCourse.course.id);
                }
              } catch (courseErr) {
                console.error('[College Orbit SW] Failed to create course:', courseErr);
              }
            }
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
