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
        const lsCourseId = message.lsCourseId || '';

        // If we have an lsCourseId, fetch courses to find the matching course
        let matchingCourseId = null;
        if (lsCourseId) {
          try {
            const courseData = await OrbitAPI.fetch('/api/courses');
            const courses = courseData.courses || [];
            const matchedCourse = courses.find(c => c.learningSuiteCourseId === lsCourseId);
            if (matchedCourse) {
              matchingCourseId = matchedCourse.id;
              console.log('[College Orbit SW] Found matching course for LS course:', lsCourseId, '->', matchingCourseId);
            }
          } catch (e) {
            console.log('[College Orbit SW] Failed to fetch courses:', e);
          }
        }

        let foundItem = null;
        let matchReason = '';
        const isGradebookUrl = canvasUrl && canvasUrl.includes('/gradebook');

        console.log('[College Orbit SW] CHECK_ASSIGNMENT_EXISTS:', {
          title,
          canvasUrl,
          isGradebookUrl,
          assignmentId,
          lsCourseId,
          matchingCourseId,
          totalItems: items.length
        });

        for (const w of items) {
          // Check links for matching URL (strip query params for comparison)
          // Skip gradebook URLs as they're not unique per assignment
          const linkUrls = (w.links || []).map((l) => (l.url || '').split('?')[0]);

          // URL match - skip if current page is a gradebook URL
          if (canvasUrl && !isGradebookUrl && linkUrls.some((u) => u === canvasUrl)) {
            foundItem = w;
            matchReason = 'URL match';
            break;
          }

          // Assignment ID in link URL
          if (assignmentId && linkUrls.some((u) => u.includes(assignmentId))) {
            foundItem = w;
            matchReason = 'assignmentId in link';
            break;
          }

          // Check canvasAssignmentId field
          if (assignmentId && (w.canvasAssignmentId === assignmentId || w.canvasAssignmentId === String(assignmentId))) {
            foundItem = w;
            matchReason = 'canvasAssignmentId field';
            break;
          }

          // Check title match - EXACT match only, AND must match course if we have course info
          if (title) {
            const wTitle = (w.title || '').toLowerCase().trim();
            if (wTitle === title) {
              // If we have course info, require course match to avoid cross-course title collisions
              if (matchingCourseId) {
                if (w.courseId === matchingCourseId) {
                  foundItem = w;
                  matchReason = 'title + course match';
                  break;
                }
                // Don't match - title matches but course doesn't
                console.log('[College Orbit SW] Title matched but course mismatch:', { wTitle, wCourseId: w.courseId, matchingCourseId });
              } else if (lsCourseId) {
                // Learning Suite: we have lsCourseId but no matching course - DON'T fall back to title-only
                // This prevents matching assignments in other courses with the same name
                console.log('[College Orbit SW] Title matched but LS course not found - not matching:', { wTitle, lsCourseId });
              } else {
                // Canvas or no course info: fall back to title-only match
                foundItem = w;
                matchReason = 'title only (no course info)';
                break;
              }
            }
          }
        }

        if (foundItem) {
          console.log('[College Orbit SW] MATCHED:', {
            reason: matchReason,
            foundId: foundItem.id,
            foundTitle: foundItem.title,
            foundCourseId: foundItem.courseId,
            searchedTitle: title,
            searchedCourseId: matchingCourseId
          });
        } else {
          console.log('[College Orbit SW] No match found');
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
        if (message.existingWorkItemId) {
          console.log('[College Orbit SW] Updating existing item:', message.existingWorkItemId);

          // Fetch the current item from the server to get latest data
          const currentItemResponse = await OrbitAPI.fetch(`/api/work/${message.existingWorkItemId}`);
          const currentItem = currentItemResponse?.workItem || currentItemResponse || {};
          const existingNotes = currentItem.notes || '';
          const existingLinks = currentItem.links || [];

          // Build updated notes - preserve user notes, update LMS section
          let notes = existingNotes;
          const lmsSectionRegex = /─── From (Canvas|Learning Suite) ───[\s\S]*$/;

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

          // Build links - keep all existing, add LMS link if missing
          let newLinks = [...existingLinks];

          // Add LMS link if not already present
          if (d.canvasUrl) {
            const hasLmsLink = existingLinks.some(l => l.url === d.canvasUrl || l.label === sourceLabel);
            if (!hasLmsLink) {
              newLinks.push({ label: sourceLabel, url: d.canvasUrl });
            }
          }

          // Add discussion link if not already present
          if (d.discussionUrl) {
            const hasDiscussionLink = existingLinks.some(l => l.url === d.discussionUrl || l.label === 'Discussion');
            if (!hasDiscussionLink) {
              newLinks.push({ label: 'Discussion', url: d.discussionUrl });
            }
          }

          await OrbitAPI.fetch(`/api/work/${message.existingWorkItemId}`, {
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

        // Otherwise, check if this assignment already exists to prevent duplicates
        const existingData = await OrbitAPI.fetch('/api/work');
        const existingItems = existingData.workItems || [];
        const canvasUrl = (d.canvasUrl || '').split('?')[0];
        const title = (d.title || '').toLowerCase().trim();
        const isGradebookUrl = canvasUrl && canvasUrl.includes('/gradebook');

        // If we have an lsCourseId, find the matching Orbit course
        // But verify the course code matches to catch corrupted data
        let matchingCourseId = null;
        if (d.lsCourseId) {
          try {
            const courseData = await OrbitAPI.fetch('/api/courses');
            const courses = courseData.courses || [];
            const matchedCourse = courses.find(c => c.learningSuiteCourseId === d.lsCourseId);
            if (matchedCourse) {
              // Parse course code from scraped name
              const codeMatch = d.courseName?.match(/^([A-Z]{1,5}(?:\s+[A-Z]{1,5})?\s*\d{3})/i);
              const searchCode = codeMatch ? codeMatch[1].replace(/\s+/g, ' ').trim().toLowerCase() : '';
              const matchedCode = (matchedCourse.code || '').replace(/\s+/g, ' ').trim().toLowerCase();

              // Sanity check: first letters should match
              if (searchCode && matchedCode && searchCode.charAt(0) !== matchedCode.charAt(0)) {
                console.log('[College Orbit SW] ADD: lsCourseId matched but codes differ - NOT using:', searchCode, 'vs', matchedCode);
              } else {
                matchingCourseId = matchedCourse.id;
                console.log('[College Orbit SW] ADD: Found matching course for LS course:', d.lsCourseId, '->', matchingCourseId, matchedCourse.code);
              }
            }
          } catch (e) {
            console.log('[College Orbit SW] ADD: Failed to fetch courses:', e);
          }
        }

        let existingItem = null;
        for (const w of existingItems) {
          const linkUrls = (w.links || []).map((l) => (l.url || '').split('?')[0]);
          // Check by URL - but skip gradebook URLs as they're not unique per assignment
          if (canvasUrl && !isGradebookUrl && linkUrls.some((u) => u === canvasUrl)) { existingItem = w; break; }
          // Check by assignment ID in URL
          if (d.canvasAssignmentId && linkUrls.some((u) => u.includes(d.canvasAssignmentId))) { existingItem = w; break; }
          // Check by canvasAssignmentId field
          if (d.canvasAssignmentId && (w.canvasAssignmentId === d.canvasAssignmentId || w.canvasAssignmentId === String(d.canvasAssignmentId))) { existingItem = w; break; }
          // Check by exact title match - require course match for Learning Suite to avoid cross-course collisions
          if (title) {
            const wTitle = (w.title || '').toLowerCase().trim();
            if (wTitle === title) {
              if (matchingCourseId) {
                // For Learning Suite, require course match
                if (w.courseId === matchingCourseId) {
                  existingItem = w;
                  break;
                }
                // Don't match - same title but different course
              } else if (d.lsCourseId) {
                // Learning Suite: we have lsCourseId but no matching course - DON'T fall back to title-only
                // This prevents updating assignments in other courses with the same name
              } else {
                // Canvas or no course info: use title-only match
                existingItem = w;
                break;
              }
            }
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
            // Parse course code from name - handle formats like "A HTG 100", "CS 142", "WRTG 150"
            const codeMatch = d.courseName.match(/^([A-Z]{1,5}(?:\s+[A-Z]{1,5})?\s*\d{3})/i);
            const searchCode = codeMatch ? codeMatch[1].replace(/\s+/g, ' ').trim().toLowerCase() : '';

            console.log('[College Orbit SW] Course matching - scraped name:', d.courseName, 'extracted code:', searchCode, 'lsCourseId:', d.lsCourseId);

            // For Learning Suite, first check by lsCourseId
            let match = null;
            if (d.source === 'learningsuite' && d.lsCourseId) {
              const lsMatch = courses.find((c) => c.learningSuiteCourseId === d.lsCourseId);
              if (lsMatch) {
                // Sanity check: verify the course codes are similar (first letter or number matches)
                const matchedCode = (lsMatch.code || '').toLowerCase();
                const searchFirst = searchCode.charAt(0);
                const matchedFirst = matchedCode.charAt(0);

                if (searchFirst === matchedFirst || !searchCode) {
                  match = lsMatch;
                  console.log('[College Orbit SW] Matched course by lsCourseId:', d.lsCourseId, '->', lsMatch.code);
                } else {
                  console.log('[College Orbit SW] lsCourseId matched but codes differ - rejecting:', searchCode, 'vs', matchedCode);
                  // The stored lsCourseId is wrong on this course, clear it
                }
              }
            }

            // If not found by ID, try EXACT course code match only
            if (!match && searchCode) {
              match = courses.find((c) => {
                const courseCode = (c.code || '').replace(/\s+/g, ' ').trim().toLowerCase();
                return courseCode === searchCode;
              });
              if (match) {
                console.log('[College Orbit SW] Matched course by exact code:', searchCode);
              }
            }

            if (match) {
              body.courseId = match.id;
              console.log('[College Orbit SW] Using course:', match.id, match.code);
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
