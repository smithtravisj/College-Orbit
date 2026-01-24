import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock Blackboard API Server for local testing
 *
 * Usage: Set your Blackboard instance URL to "localhost:3008/api/mock-blackboard"
 * Application Key: "test-key"
 * Application Secret: "test-secret"
 */

// Mock data
const MOCK_USER = {
  id: 'mock-user-123',
  uuid: 'mock-uuid-123',
  userName: 'testuser',
  name: {
    given: 'Test',
    family: 'User',
  },
  contact: {
    email: 'testuser@example.edu',
  },
};

const MOCK_COURSES = [
  {
    id: 'course-001',
    uuid: 'course-uuid-001',
    courseId: 'CS101',
    name: 'Introduction to Computer Science',
    description: 'Learn the fundamentals of programming',
    availability: {
      available: 'Yes' as const,
      duration: {
        type: 'DateRange',
        start: '2026-01-15T00:00:00Z',
        end: '2026-05-15T00:00:00Z',
      },
    },
  },
  {
    id: 'course-002',
    uuid: 'course-uuid-002',
    courseId: 'MATH201',
    name: 'Calculus II',
    description: 'Advanced calculus topics',
    availability: {
      available: 'Yes' as const,
      duration: {
        type: 'DateRange',
        start: '2026-01-15T00:00:00Z',
        end: '2026-05-15T00:00:00Z',
      },
    },
  },
];

const MOCK_MEMBERSHIPS = MOCK_COURSES.map((course, idx) => ({
  id: `membership-${idx + 1}`,
  userId: MOCK_USER.id,
  courseId: course.id,
  availability: { available: 'Yes' as const },
  courseRoleId: 'Student',
  created: '2026-01-10T00:00:00Z',
  lastAccessed: new Date().toISOString(),
  course,
}));

const MOCK_GRADEBOOK_COLUMNS: Record<string, Array<{
  id: string;
  name: string;
  description: string;
  externalGrade: boolean;
  score: { possible: number };
  availability: { available: 'Yes' | 'No' };
  grading: { type: string; due: string };
}>> = {
  'course-001': [
    {
      id: 'col-001',
      name: 'Homework 1: Variables and Types',
      description: '<p>Complete exercises 1-10 from Chapter 2.</p><p>Submit as a PDF.</p><a href="https://example.com/resources">Resources</a>',
      externalGrade: false,
      score: { possible: 100 },
      availability: { available: 'Yes' },
      grading: { type: 'Attempts', due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    },
    {
      id: 'col-002',
      name: 'Midterm Exam',
      description: '<p>Covers chapters 1-5. Closed book.</p>',
      externalGrade: false,
      score: { possible: 200 },
      availability: { available: 'Yes' },
      grading: { type: 'Attempts', due: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() },
    },
    {
      id: 'col-003',
      name: 'Programming Project',
      description: '<p>Build a simple calculator application.</p><ul><li>Must handle +, -, *, /</li><li>Include error handling</li></ul>',
      externalGrade: false,
      score: { possible: 150 },
      availability: { available: 'Yes' },
      grading: { type: 'Attempts', due: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString() },
    },
  ],
  'course-002': [
    {
      id: 'col-101',
      name: 'Integration Practice',
      description: '<p>Complete problems 1-20.</p>',
      externalGrade: false,
      score: { possible: 50 },
      availability: { available: 'Yes' },
      grading: { type: 'Attempts', due: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
    },
    {
      id: 'col-102',
      name: 'Series and Sequences Quiz',
      description: '<p>Online quiz covering Taylor series.</p>',
      externalGrade: false,
      score: { possible: 25 },
      availability: { available: 'Yes' },
      grading: { type: 'Attempts', due: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
    },
  ],
};

const MOCK_GRADES: Record<string, { score: number; status: string; attemptId: string; gradedAt: string } | null> = {
  'col-001': { score: 95, status: 'Graded', attemptId: 'attempt-001', gradedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  'col-002': null, // Not submitted yet
  'col-003': null,
  'col-101': { score: 45, status: 'Graded', attemptId: 'attempt-101', gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  'col-102': null,
};

const MOCK_CALENDAR_ITEMS = [
  {
    id: 'event-001',
    type: 'Course',
    calendarId: 'course-001',
    calendarName: 'CS101',
    title: 'Office Hours',
    description: 'Weekly office hours with Prof. Smith',
    start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    location: 'Room 301',
  },
  {
    id: 'event-002',
    type: 'Course',
    calendarId: 'course-002',
    calendarName: 'MATH201',
    title: 'Review Session',
    description: 'Pre-exam review session',
    start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    location: 'Lecture Hall A',
  },
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');

  // OAuth token endpoint
  if (pathStr === 'learn/api/public/v1/oauth2/token') {
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Basic ')) {
      return NextResponse.json({ status: 401, message: 'Unauthorized' }, { status: 401 });
    }

    // Decode and verify credentials
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [key, secret] = credentials.split(':');

    if (key !== 'test-key' || secret !== 'test-secret') {
      return NextResponse.json({ status: 401, message: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({
      access_token: 'mock-access-token-' + Date.now(),
      token_type: 'bearer',
      expires_in: 3600, // 1 hour
    });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');

  // Check authorization
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer mock-access-token-')) {
    return NextResponse.json({ status: 401, message: 'Unauthorized' }, { status: 401 });
  }

  // Current user
  if (pathStr === 'learn/api/public/v1/users/me') {
    return NextResponse.json(MOCK_USER);
  }

  // User memberships (courses)
  if (pathStr.match(/^learn\/api\/public\/v1\/users\/[^/]+\/courses$/)) {
    return NextResponse.json({
      results: MOCK_MEMBERSHIPS,
    });
  }

  // Single course
  const courseMatch = pathStr.match(/^learn\/api\/public\/v3\/courses\/([^/]+)$/);
  if (courseMatch) {
    const course = MOCK_COURSES.find(c => c.id === courseMatch[1]);
    if (course) {
      return NextResponse.json(course);
    }
    return NextResponse.json({ status: 404, message: 'Course not found' }, { status: 404 });
  }

  // Gradebook columns
  const columnsMatch = pathStr.match(/^learn\/api\/public\/v2\/courses\/([^/]+)\/gradebook\/columns$/);
  if (columnsMatch) {
    const courseId = columnsMatch[1];
    const columns = MOCK_GRADEBOOK_COLUMNS[courseId] || [];
    return NextResponse.json({ results: columns });
  }

  // User grade for a column
  const gradeMatch = pathStr.match(/^learn\/api\/public\/v2\/courses\/([^/]+)\/gradebook\/columns\/([^/]+)\/users\/([^/]+)$/);
  if (gradeMatch) {
    const columnId = gradeMatch[2];
    const grade = MOCK_GRADES[columnId];

    if (grade) {
      return NextResponse.json({
        userId: MOCK_USER.id,
        columnId,
        status: grade.status,
        score: grade.score,
        attemptId: grade.attemptId,
        lastAttempted: grade.gradedAt,
        exempt: false,
      });
    }

    // No grade yet - return empty/pending state
    return NextResponse.json({
      userId: MOCK_USER.id,
      columnId,
      status: 'NotAttempted',
      exempt: false,
    });
  }

  // Calendar items
  if (pathStr === 'learn/api/public/v1/calendars/items') {
    return NextResponse.json({ results: MOCK_CALENDAR_ITEMS });
  }

  console.log('[Mock Blackboard] Unknown path:', pathStr);
  return NextResponse.json({ error: 'Not found', path: pathStr }, { status: 404 });
}
