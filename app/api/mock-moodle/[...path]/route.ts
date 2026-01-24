import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock Moodle API Server for local testing
 *
 * Usage: Set your Moodle instance URL to "localhost:3008/api/mock-moodle"
 * Web Service Token: "test-token-12345"
 */

// Mock data
const MOCK_USER = {
  id: 101,
  username: 'testuser',
  firstname: 'Test',
  lastname: 'User',
  fullname: 'Test User',
  email: 'testuser@example.edu',
  lang: 'en',
  timezone: 'America/New_York',
};

const MOCK_SITE_INFO = {
  sitename: 'Test University Moodle',
  username: MOCK_USER.username,
  firstname: MOCK_USER.firstname,
  lastname: MOCK_USER.lastname,
  fullname: MOCK_USER.fullname,
  lang: MOCK_USER.lang,
  userid: MOCK_USER.id,
  siteurl: 'https://moodle.example.edu',
  userpictureurl: '',
  functions: [
    { name: 'core_webservice_get_site_info', version: '2023010100' },
    { name: 'core_enrol_get_users_courses', version: '2023010100' },
    { name: 'mod_assign_get_assignments', version: '2023010100' },
  ],
};

const MOCK_COURSES = [
  {
    id: 1001,
    shortname: 'CS101',
    fullname: 'Introduction to Computer Science',
    displayname: 'Introduction to Computer Science',
    enrolledusercount: 45,
    idnumber: 'CS-101-2026SP',
    visible: 1,
    summary: '<p>Learn the fundamentals of programming and computational thinking.</p>',
    summaryformat: 1,
    format: 'topics',
    showgrades: true,
    lang: '',
    enablecompletion: true,
    completionhascriteria: true,
    startdate: new Date('2026-01-15').getTime() / 1000,
    enddate: new Date('2026-05-15').getTime() / 1000,
    category: 1,
  },
  {
    id: 1002,
    shortname: 'MATH201',
    fullname: 'Calculus II',
    displayname: 'Calculus II',
    enrolledusercount: 32,
    idnumber: 'MATH-201-2026SP',
    visible: 1,
    summary: '<p>Advanced calculus topics including integration techniques and series.</p>',
    summaryformat: 1,
    format: 'topics',
    showgrades: true,
    lang: '',
    enablecompletion: true,
    completionhascriteria: true,
    startdate: new Date('2026-01-15').getTime() / 1000,
    enddate: new Date('2026-05-15').getTime() / 1000,
    category: 2,
  },
  {
    id: 1003,
    shortname: 'PHYS150',
    fullname: 'Physics for Engineers',
    displayname: 'Physics for Engineers',
    enrolledusercount: 28,
    idnumber: 'PHYS-150-2026SP',
    visible: 1,
    summary: '<p>Mechanics, thermodynamics, and waves for engineering students.</p>',
    summaryformat: 1,
    format: 'weeks',
    showgrades: true,
    lang: '',
    enablecompletion: true,
    completionhascriteria: true,
    startdate: new Date('2026-01-15').getTime() / 1000,
    enddate: new Date('2026-05-15').getTime() / 1000,
    category: 3,
  },
];

const MOCK_ASSIGNMENTS: Record<number, Array<{
  id: number;
  cmid: number;
  course: number;
  name: string;
  intro: string;
  introformat: number;
  duedate: number;
  allowsubmissionsfromdate: number;
  grade: number;
  timemodified: number;
  completionsubmit: number;
  nosubmissions: number;
  submissiondrafts: number;
}>> = {
  1001: [
    {
      id: 2001,
      cmid: 3001,
      course: 1001,
      name: 'Lab 1: Hello World',
      intro: '<p>Write your first program that prints "Hello, World!" to the console.</p><p>Requirements:</p><ul><li>Use proper formatting</li><li>Add comments</li></ul><a href="https://example.com/tutorial">Tutorial Link</a>',
      introformat: 1,
      duedate: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      allowsubmissionsfromdate: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
      grade: 100,
      timemodified: Math.floor(Date.now() / 1000),
      completionsubmit: 1,
      nosubmissions: 0,
      submissiondrafts: 0,
    },
    {
      id: 2002,
      cmid: 3002,
      course: 1001,
      name: 'Lab 2: Variables and Data Types',
      intro: '<p>Practice working with different data types in Python.</p>',
      introformat: 1,
      duedate: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60,
      allowsubmissionsfromdate: Math.floor(Date.now() / 1000),
      grade: 100,
      timemodified: Math.floor(Date.now() / 1000),
      completionsubmit: 1,
      nosubmissions: 0,
      submissiondrafts: 0,
    },
    {
      id: 2003,
      cmid: 3003,
      course: 1001,
      name: 'Midterm Project: Calculator App',
      intro: '<p>Build a fully functional calculator application.</p><p>Must support: +, -, *, /, and handle errors gracefully.</p>',
      introformat: 1,
      duedate: Math.floor(Date.now() / 1000) + 28 * 24 * 60 * 60,
      allowsubmissionsfromdate: Math.floor(Date.now() / 1000),
      grade: 200,
      timemodified: Math.floor(Date.now() / 1000),
      completionsubmit: 1,
      nosubmissions: 0,
      submissiondrafts: 0,
    },
  ],
  1002: [
    {
      id: 2101,
      cmid: 3101,
      course: 1002,
      name: 'Homework 1: Integration by Parts',
      intro: '<p>Complete problems 1-15 from Section 7.1</p>',
      introformat: 1,
      duedate: Math.floor(Date.now() / 1000) + 5 * 24 * 60 * 60,
      allowsubmissionsfromdate: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
      grade: 50,
      timemodified: Math.floor(Date.now() / 1000),
      completionsubmit: 1,
      nosubmissions: 0,
      submissiondrafts: 0,
    },
    {
      id: 2102,
      cmid: 3102,
      course: 1002,
      name: 'Quiz: Taylor Series',
      intro: '<p>Online quiz covering Taylor and Maclaurin series. 30 minutes, one attempt.</p>',
      introformat: 1,
      duedate: Math.floor(Date.now() / 1000) + 12 * 24 * 60 * 60,
      allowsubmissionsfromdate: Math.floor(Date.now() / 1000) + 10 * 24 * 60 * 60,
      grade: 25,
      timemodified: Math.floor(Date.now() / 1000),
      completionsubmit: 1,
      nosubmissions: 0,
      submissiondrafts: 0,
    },
  ],
  1003: [
    {
      id: 2201,
      cmid: 3201,
      course: 1003,
      name: 'Lab Report: Projectile Motion',
      intro: '<p>Write a lab report analyzing your projectile motion experiment data.</p>',
      introformat: 1,
      duedate: Math.floor(Date.now() / 1000) + 10 * 24 * 60 * 60,
      allowsubmissionsfromdate: Math.floor(Date.now() / 1000),
      grade: 100,
      timemodified: Math.floor(Date.now() / 1000),
      completionsubmit: 1,
      nosubmissions: 0,
      submissiondrafts: 0,
    },
  ],
};

const MOCK_SUBMISSION_STATUS: Record<number, { submitted: boolean; graded: boolean; grade?: number; timecreated?: number; timemodified?: number }> = {
  2001: { submitted: true, graded: true, grade: 95, timecreated: Math.floor(Date.now() / 1000) - 5 * 24 * 60 * 60, timemodified: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60 },
  2002: { submitted: false, graded: false },
  2003: { submitted: false, graded: false },
  2101: { submitted: true, graded: true, grade: 48, timecreated: Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60, timemodified: Math.floor(Date.now() / 1000) - 1 * 24 * 60 * 60 },
  2102: { submitted: false, graded: false },
  2201: { submitted: false, graded: false },
};

const MOCK_GRADE_ITEMS: Record<number, Array<{
  id: number;
  itemname: string;
  itemtype: string;
  itemmodule: string;
  iteminstance: number;
  itemnumber: number;
  categoryid: number;
  outcomeid: number | null;
  graderaw: number | null;
  grademax: number;
  grademin: number;
  feedback: string;
}>> = {
  1001: [
    { id: 5001, itemname: 'Lab 1: Hello World', itemtype: 'mod', itemmodule: 'assign', iteminstance: 2001, itemnumber: 0, categoryid: 1, outcomeid: null, graderaw: 95, grademax: 100, grademin: 0, feedback: 'Great job!' },
    { id: 5002, itemname: 'Lab 2: Variables and Data Types', itemtype: 'mod', itemmodule: 'assign', iteminstance: 2002, itemnumber: 0, categoryid: 1, outcomeid: null, graderaw: null, grademax: 100, grademin: 0, feedback: '' },
    { id: 5003, itemname: 'Midterm Project: Calculator App', itemtype: 'mod', itemmodule: 'assign', iteminstance: 2003, itemnumber: 0, categoryid: 1, outcomeid: null, graderaw: null, grademax: 200, grademin: 0, feedback: '' },
  ],
  1002: [
    { id: 5101, itemname: 'Homework 1: Integration by Parts', itemtype: 'mod', itemmodule: 'assign', iteminstance: 2101, itemnumber: 0, categoryid: 2, outcomeid: null, graderaw: 48, grademax: 50, grademin: 0, feedback: 'Excellent work on the difficult problems.' },
    { id: 5102, itemname: 'Quiz: Taylor Series', itemtype: 'mod', itemmodule: 'assign', iteminstance: 2102, itemnumber: 0, categoryid: 2, outcomeid: null, graderaw: null, grademax: 25, grademin: 0, feedback: '' },
  ],
  1003: [
    { id: 5201, itemname: 'Lab Report: Projectile Motion', itemtype: 'mod', itemmodule: 'assign', iteminstance: 2201, itemnumber: 0, categoryid: 3, outcomeid: null, graderaw: null, grademax: 100, grademin: 0, feedback: '' },
  ],
};

const MOCK_CALENDAR_EVENTS = [
  {
    id: 6001,
    name: 'CS101 Office Hours',
    description: '<p>Weekly office hours with Prof. Johnson</p>',
    descriptionformat: 1,
    courseid: 1001,
    timestart: Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60,
    timeduration: 3600,
    eventtype: 'course',
    modulename: '',
    instance: 0,
    url: '',
  },
  {
    id: 6002,
    name: 'MATH201 Review Session',
    description: '<p>Exam review session covering chapters 5-7</p>',
    descriptionformat: 1,
    courseid: 1002,
    timestart: Math.floor(Date.now() / 1000) + 5 * 24 * 60 * 60,
    timeduration: 7200,
    eventtype: 'course',
    modulename: '',
    instance: 0,
    url: '',
  },
  {
    id: 6003,
    name: 'PHYS150 Lab',
    description: '<p>Hands-on lab session - bring safety goggles</p>',
    descriptionformat: 1,
    courseid: 1003,
    timestart: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60,
    timeduration: 5400,
    eventtype: 'course',
    modulename: '',
    instance: 0,
    url: '',
  },
];

const MOCK_FORUMS: Record<number, Array<{
  id: number;
  course: number;
  name: string;
  type: string;
  intro: string;
}>> = {
  1001: [
    { id: 7001, course: 1001, name: 'Announcements', type: 'news', intro: 'Course announcements' },
    { id: 7002, course: 1001, name: 'General Discussion', type: 'general', intro: 'General course discussion' },
  ],
  1002: [
    { id: 7101, course: 1002, name: 'Announcements', type: 'news', intro: 'Course announcements' },
  ],
  1003: [
    { id: 7201, course: 1003, name: 'Announcements', type: 'news', intro: 'Course announcements' },
  ],
};

const MOCK_DISCUSSIONS: Record<number, Array<{
  id: number;
  name: string;
  timemodified: number;
  usermodified: number;
  pinned: boolean;
}>> = {
  7001: [
    { id: 8001, name: 'Welcome to CS101!', timemodified: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60, usermodified: 999, pinned: true },
    { id: 8002, name: 'Lab 1 Due Date Extended', timemodified: Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60, usermodified: 999, pinned: false },
  ],
  7101: [
    { id: 8101, name: 'Midterm Exam Information', timemodified: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60, usermodified: 999, pinned: true },
  ],
  7201: [
    { id: 8201, name: 'Lab Safety Reminder', timemodified: Math.floor(Date.now() / 1000) - 1 * 24 * 60 * 60, usermodified: 999, pinned: false },
  ],
};

const MOCK_POSTS: Record<number, Array<{
  id: number;
  discussionid: number;
  subject: string;
  message: string;
  messageformat: number;
  timecreated: number;
  author: { id: number; fullname: string };
}>> = {
  8001: [
    {
      id: 9001,
      discussionid: 8001,
      subject: 'Welcome to CS101!',
      message: '<p>Welcome to Introduction to Computer Science! I\'m excited to have you all in class this semester.</p><p>Please review the syllabus and complete Lab 0 by Friday.</p>',
      messageformat: 1,
      timecreated: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
      author: { id: 999, fullname: 'Prof. Johnson' },
    },
  ],
  8002: [
    {
      id: 9002,
      discussionid: 8002,
      subject: 'Lab 1 Due Date Extended',
      message: '<p>Due to the weather-related campus closure, Lab 1 has been extended to next Monday.</p>',
      messageformat: 1,
      timecreated: Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60,
      author: { id: 999, fullname: 'Prof. Johnson' },
    },
  ],
  8101: [
    {
      id: 9101,
      discussionid: 8101,
      subject: 'Midterm Exam Information',
      message: '<p>The midterm exam will be held on February 28th in the regular classroom. You may bring one 8.5x11 sheet of notes (both sides).</p>',
      messageformat: 1,
      timecreated: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60,
      author: { id: 998, fullname: 'Prof. Smith' },
    },
  ],
  8201: [
    {
      id: 9201,
      discussionid: 8201,
      subject: 'Lab Safety Reminder',
      message: '<p>Reminder: Safety goggles are required for all lab sessions. No open-toed shoes allowed.</p>',
      messageformat: 1,
      timecreated: Math.floor(Date.now() / 1000) - 1 * 24 * 60 * 60,
      author: { id: 997, fullname: 'Prof. Chen' },
    },
  ],
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleMoodleRequest(req, params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleMoodleRequest(req, params);
}

async function handleMoodleRequest(
  req: NextRequest,
  params: Promise<{ path: string[] }>
) {
  const { path } = await params;
  const pathStr = path.join('/');

  // Moodle uses webservice/rest/server.php with query params
  if (pathStr === 'webservice/rest/server.php') {
    const url = new URL(req.url);
    const wstoken = url.searchParams.get('wstoken');
    const wsfunction = url.searchParams.get('wsfunction');

    // Validate token
    if (wstoken !== 'test-token-12345') {
      return NextResponse.json({
        exception: 'moodle_exception',
        errorcode: 'invalidtoken',
        message: 'Invalid token - token not found',
      }, { status: 401 });
    }

    // Handle different Moodle web service functions
    switch (wsfunction) {
      case 'core_webservice_get_site_info':
        return NextResponse.json(MOCK_SITE_INFO);

      case 'core_user_get_users_by_field':
        return NextResponse.json([MOCK_USER]);

      case 'core_enrol_get_users_courses': {
        // Return courses for the authenticated user (or specified user)
        // Real Moodle API returns courses for the token owner if no userid specified
        return NextResponse.json(MOCK_COURSES);
      }

      case 'mod_assign_get_assignments': {
        // Collect all course IDs from the request (courseids[0], courseids[1], etc.)
        const courseIds: number[] = [];
        let i = 0;
        while (url.searchParams.has(`courseids[${i}]`)) {
          const courseId = url.searchParams.get(`courseids[${i}]`);
          if (courseId) {
            courseIds.push(parseInt(courseId));
          }
          i++;
        }

        if (courseIds.length > 0) {
          // Return assignments for all requested courses
          const courses = courseIds.map(courseId => ({
            id: courseId,
            fullname: MOCK_COURSES.find(c => c.id === courseId)?.fullname || '',
            shortname: MOCK_COURSES.find(c => c.id === courseId)?.shortname || '',
            assignments: MOCK_ASSIGNMENTS[courseId] || [],
          }));
          return NextResponse.json({
            courses,
            warnings: [],
          });
        }
        // Return all assignments if no specific courses
        return NextResponse.json({
          courses: MOCK_COURSES.map(course => ({
            id: course.id,
            fullname: course.fullname,
            shortname: course.shortname,
            assignments: MOCK_ASSIGNMENTS[course.id] || [],
          })),
          warnings: [],
        });
      }

      case 'mod_assign_get_submission_status': {
        const assignid = url.searchParams.get('assignid');
        if (assignid) {
          const assignmentId = parseInt(assignid);
          const status = MOCK_SUBMISSION_STATUS[assignmentId];
          if (status) {
            return NextResponse.json({
              lastattempt: {
                submission: status.submitted ? {
                  id: assignmentId * 10,
                  userid: MOCK_USER.id,
                  timecreated: status.timecreated,
                  timemodified: status.timemodified,
                  status: 'submitted',
                } : null,
                graded: status.graded,
              },
              feedback: status.graded ? {
                grade: {
                  grade: status.grade,
                  grader: 999,
                  timemodified: status.timemodified,
                },
              } : null,
            });
          }
        }
        return NextResponse.json({ lastattempt: null, feedback: null });
      }

      case 'gradereport_user_get_grade_items': {
        const courseid = url.searchParams.get('courseid');
        const userid = url.searchParams.get('userid');
        if (courseid && userid) {
          const courseId = parseInt(courseid);
          const gradeItems = MOCK_GRADE_ITEMS[courseId] || [];
          return NextResponse.json({
            usergrades: [{
              courseid: courseId,
              userid: parseInt(userid),
              gradeitems: gradeItems,
            }],
            warnings: [],
          });
        }
        return NextResponse.json({ usergrades: [], warnings: [] });
      }

      case 'core_calendar_get_action_events_by_timesort': {
        return NextResponse.json({
          events: MOCK_CALENDAR_EVENTS,
          firstid: MOCK_CALENDAR_EVENTS[0]?.id || 0,
          lastid: MOCK_CALENDAR_EVENTS[MOCK_CALENDAR_EVENTS.length - 1]?.id || 0,
        });
      }

      case 'core_calendar_get_calendar_events': {
        // Filter by course IDs if provided
        const courseIds: number[] = [];
        let i = 0;
        while (url.searchParams.has(`events[courseids][${i}]`)) {
          const courseId = url.searchParams.get(`events[courseids][${i}]`);
          if (courseId) {
            courseIds.push(parseInt(courseId));
          }
          i++;
        }

        let events = MOCK_CALENDAR_EVENTS;
        if (courseIds.length > 0) {
          events = events.filter(e => courseIds.includes(e.courseid));
        }

        return NextResponse.json({
          events,
          warnings: [],
        });
      }

      case 'mod_forum_get_forums_by_courses': {
        const courseidsParam = url.searchParams.get('courseids[0]');
        if (courseidsParam) {
          const courseId = parseInt(courseidsParam);
          return NextResponse.json(MOCK_FORUMS[courseId] || []);
        }
        // Return all forums
        const allForums = Object.values(MOCK_FORUMS).flat();
        return NextResponse.json(allForums);
      }

      case 'mod_forum_get_forum_discussions': {
        const forumid = url.searchParams.get('forumid');
        if (forumid) {
          const forumId = parseInt(forumid);
          const discussions = MOCK_DISCUSSIONS[forumId] || [];
          return NextResponse.json({
            discussions,
            warnings: [],
          });
        }
        return NextResponse.json({ discussions: [], warnings: [] });
      }

      case 'mod_forum_get_discussion_posts': {
        const discussionid = url.searchParams.get('discussionid');
        if (discussionid) {
          const discId = parseInt(discussionid);
          const posts = MOCK_POSTS[discId] || [];
          return NextResponse.json({
            posts,
            warnings: [],
          });
        }
        return NextResponse.json({ posts: [], warnings: [] });
      }

      default:
        console.log('[Mock Moodle] Unknown function:', wsfunction);
        return NextResponse.json({
          exception: 'moodle_exception',
          errorcode: 'invalidfunction',
          message: `Unknown function: ${wsfunction}`,
        }, { status: 400 });
    }
  }

  console.log('[Mock Moodle] Unknown path:', pathStr);
  return NextResponse.json({ error: 'Not found', path: pathStr }, { status: 404 });
}
