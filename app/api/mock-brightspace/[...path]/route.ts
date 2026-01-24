import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock Brightspace (D2L) API Server for local testing
 *
 * Usage: Set your Brightspace instance URL to "localhost:3008/api/mock-brightspace"
 * Client ID: "test-client-id"
 * Client Secret: "test-client-secret"
 */

// Mock data
const MOCK_USER = {
  Identifier: 'user-12345',
  DisplayName: 'Test User',
  EmailAddress: 'testuser@example.edu',
  OrgDefinedId: 'TU12345',
  ProfileIdentifier: 'profile-12345',
  ProfileBadgeUrl: null,
  Pronouns: '',
};

const MOCK_ENROLLMENTS = [
  {
    OrgUnit: {
      OrgUnitId: 2001,
      Type: { Id: 3, Code: 'Course Offering', Name: 'Course Offering' },
      Name: 'Introduction to Computer Science',
      Code: 'CS101-2026SP',
      HomePageUrl: '/d2l/home/2001',
      ImageUrl: null,
      StartDate: '2026-01-15T00:00:00.000Z',
      EndDate: '2026-05-15T00:00:00.000Z',
    },
    Access: {
      IsActive: true,
      StartDate: '2026-01-15T00:00:00.000Z',
      EndDate: '2026-05-15T00:00:00.000Z',
      CanAccess: true,
    },
    Role: {
      Id: 110,
      Code: 'Student',
      Name: 'Student',
    },
  },
  {
    OrgUnit: {
      OrgUnitId: 2002,
      Type: { Id: 3, Code: 'Course Offering', Name: 'Course Offering' },
      Name: 'Calculus II',
      Code: 'MATH201-2026SP',
      HomePageUrl: '/d2l/home/2002',
      ImageUrl: null,
      StartDate: '2026-01-15T00:00:00.000Z',
      EndDate: '2026-05-15T00:00:00.000Z',
    },
    Access: {
      IsActive: true,
      StartDate: '2026-01-15T00:00:00.000Z',
      EndDate: '2026-05-15T00:00:00.000Z',
      CanAccess: true,
    },
    Role: {
      Id: 110,
      Code: 'Student',
      Name: 'Student',
    },
  },
  {
    OrgUnit: {
      OrgUnitId: 2003,
      Type: { Id: 3, Code: 'Course Offering', Name: 'Course Offering' },
      Name: 'Physics for Engineers',
      Code: 'PHYS150-2026SP',
      HomePageUrl: '/d2l/home/2003',
      ImageUrl: null,
      StartDate: '2026-01-15T00:00:00.000Z',
      EndDate: '2026-05-15T00:00:00.000Z',
    },
    Access: {
      IsActive: true,
      StartDate: '2026-01-15T00:00:00.000Z',
      EndDate: '2026-05-15T00:00:00.000Z',
      CanAccess: true,
    },
    Role: {
      Id: 110,
      Code: 'Student',
      Name: 'Student',
    },
  },
];

const MOCK_DROPBOX_FOLDERS: Record<number, Array<{
  Id: number;
  CategoryId: number | null;
  Name: string;
  CustomInstructions: { Text?: string; Html?: string } | null;
  DueDate: string;
  StartDate: string;
  EndDate: string | null;
  IsHidden: boolean;
  Assessment: { ScoreDenominator: number } | null;
}>> = {
  2001: [
    {
      Id: 3001,
      CategoryId: null,
      Name: 'Lab 1: Hello World',
      CustomInstructions: { Html: '<p>Write your first program that prints "Hello, World!" to the console.</p><p>Requirements:</p><ul><li>Use proper formatting</li><li>Add comments</li></ul>' },
      DueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      StartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      EndDate: null,
      IsHidden: false,
      Assessment: { ScoreDenominator: 100 },
    },
    {
      Id: 3002,
      CategoryId: null,
      Name: 'Lab 2: Variables and Data Types',
      CustomInstructions: { Html: '<p>Practice working with different data types in Python.</p>' },
      DueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      StartDate: new Date().toISOString(),
      EndDate: null,
      IsHidden: false,
      Assessment: { ScoreDenominator: 100 },
    },
    {
      Id: 3003,
      CategoryId: null,
      Name: 'Midterm Project: Calculator App',
      CustomInstructions: { Html: '<p>Build a fully functional calculator application.</p><p>Must support: +, -, *, /, and handle errors gracefully.</p>' },
      DueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      StartDate: new Date().toISOString(),
      EndDate: null,
      IsHidden: false,
      Assessment: { ScoreDenominator: 200 },
    },
  ],
  2002: [
    {
      Id: 3101,
      CategoryId: null,
      Name: 'Homework 1: Integration by Parts',
      CustomInstructions: { Html: '<p>Complete problems 1-15 from Section 7.1</p>' },
      DueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      StartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      EndDate: null,
      IsHidden: false,
      Assessment: { ScoreDenominator: 50 },
    },
    {
      Id: 3102,
      CategoryId: null,
      Name: 'Quiz: Taylor Series',
      CustomInstructions: { Html: '<p>Online quiz covering Taylor and Maclaurin series. 30 minutes, one attempt.</p>' },
      DueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      StartDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      EndDate: null,
      IsHidden: false,
      Assessment: { ScoreDenominator: 25 },
    },
  ],
  2003: [
    {
      Id: 3201,
      CategoryId: null,
      Name: 'Lab Report: Projectile Motion',
      CustomInstructions: { Html: '<p>Write a lab report analyzing your projectile motion experiment data.</p>' },
      DueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      StartDate: new Date().toISOString(),
      EndDate: null,
      IsHidden: false,
      Assessment: { ScoreDenominator: 100 },
    },
  ],
};

const MOCK_SUBMISSIONS: Record<number, { Id: number; SubmissionDate: string; Comment: string } | null> = {
  3001: { Id: 4001, SubmissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), Comment: 'Completed!' },
  3002: null,
  3003: null,
  3101: { Id: 4101, SubmissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), Comment: '' },
  3102: null,
  3201: null,
};

const MOCK_GRADE_ITEMS: Record<number, Array<{
  Id: number;
  Name: string;
  ShortName: string;
  Description: { Html: string };
  GradeType: string;
  MaxPoints: number;
  DueDate: string | null;
}>> = {
  2001: [
    { Id: 5001, Name: 'Lab 1: Hello World', ShortName: 'Lab1', Description: { Html: '' }, GradeType: 'Numeric', MaxPoints: 100, DueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    { Id: 5002, Name: 'Lab 2: Variables and Data Types', ShortName: 'Lab2', Description: { Html: '' }, GradeType: 'Numeric', MaxPoints: 100, DueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() },
    { Id: 5003, Name: 'Midterm Project', ShortName: 'MidProj', Description: { Html: '' }, GradeType: 'Numeric', MaxPoints: 200, DueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString() },
    { Id: 5004, Name: 'Participation', ShortName: 'Part', Description: { Html: '' }, GradeType: 'Numeric', MaxPoints: 50, DueDate: null },
  ],
  2002: [
    { Id: 5101, Name: 'Homework 1', ShortName: 'HW1', Description: { Html: '' }, GradeType: 'Numeric', MaxPoints: 50, DueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
    { Id: 5102, Name: 'Quiz: Taylor Series', ShortName: 'Quiz1', Description: { Html: '' }, GradeType: 'Numeric', MaxPoints: 25, DueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString() },
    { Id: 5103, Name: 'Midterm Exam', ShortName: 'Mid', Description: { Html: '' }, GradeType: 'Numeric', MaxPoints: 100, DueDate: null },
  ],
  2003: [
    { Id: 5201, Name: 'Lab Report: Projectile Motion', ShortName: 'Lab1', Description: { Html: '' }, GradeType: 'Numeric', MaxPoints: 100, DueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
    { Id: 5202, Name: 'Midterm Exam', ShortName: 'Mid', Description: { Html: '' }, GradeType: 'Numeric', MaxPoints: 150, DueDate: null },
  ],
};

const MOCK_GRADE_VALUES: Record<number, { PointsNumerator: number; PointsDenominator: number; WeightedNumerator: number; WeightedDenominator: number } | null> = {
  5001: { PointsNumerator: 95, PointsDenominator: 100, WeightedNumerator: 95, WeightedDenominator: 100 },
  5002: null,
  5003: null,
  5004: { PointsNumerator: 48, PointsDenominator: 50, WeightedNumerator: 48, WeightedDenominator: 50 },
  5101: { PointsNumerator: 48, PointsDenominator: 50, WeightedNumerator: 48, WeightedDenominator: 50 },
  5102: null,
  5103: null,
  5201: null,
  5202: null,
};

const MOCK_CALENDAR_EVENTS = [
  {
    CalendarEventId: 6001,
    Title: 'CS101 Office Hours',
    Description: 'Weekly office hours with Prof. Johnson',
    StartDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    EndDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    OrgUnitId: 2001,
    AllDay: false,
    Location: { Name: 'Room 301' },
  },
  {
    CalendarEventId: 6002,
    Title: 'MATH201 Review Session',
    Description: 'Exam review session covering chapters 5-7',
    StartDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    EndDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    OrgUnitId: 2002,
    AllDay: false,
    Location: { Name: 'Lecture Hall A' },
  },
  {
    CalendarEventId: 6003,
    Title: 'PHYS150 Lab Session',
    Description: 'Hands-on lab session - bring safety goggles',
    StartDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    EndDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    OrgUnitId: 2003,
    AllDay: false,
    Location: { Name: 'Physics Lab 102' },
  },
];

const MOCK_NEWS_ITEMS: Record<number, Array<{
  Id: number;
  Title: string;
  Body: { Html: string };
  StartDate: string;
  EndDate: string | null;
  IsHidden: boolean;
  CreatedDate: string;
}>> = {
  2001: [
    {
      Id: 7001,
      Title: 'Welcome to CS101!',
      Body: { Html: '<p>Welcome to Introduction to Computer Science! I\'m excited to have you all in class this semester.</p><p>Please review the syllabus and complete Lab 0 by Friday.</p>' },
      StartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      EndDate: null,
      IsHidden: false,
      CreatedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      Id: 7002,
      Title: 'Lab 1 Due Date Extended',
      Body: { Html: '<p>Due to the weather-related campus closure, Lab 1 has been extended to next Monday.</p>' },
      StartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      EndDate: null,
      IsHidden: false,
      CreatedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  2002: [
    {
      Id: 7101,
      Title: 'Midterm Exam Information',
      Body: { Html: '<p>The midterm exam will be held on February 28th in the regular classroom. You may bring one 8.5x11 sheet of notes (both sides).</p>' },
      StartDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      EndDate: null,
      IsHidden: false,
      CreatedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  2003: [
    {
      Id: 7201,
      Title: 'Lab Safety Reminder',
      Body: { Html: '<p>Reminder: Safety goggles are required for all lab sessions. No open-toed shoes allowed in the lab.</p>' },
      StartDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      EndDate: null,
      IsHidden: false,
      CreatedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');

  // OAuth token endpoint
  if (pathStr === 'd2l/auth/token' || pathStr === 'core/oauth2/token' || pathStr === 'd2l/lp/auth/oauth2/token') {
    const body = await req.text();
    const formData = new URLSearchParams(body);

    const clientId = formData.get('client_id');
    const clientSecret = formData.get('client_secret');
    const grantType = formData.get('grant_type');

    if (grantType !== 'client_credentials') {
      return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
    }

    if (clientId !== 'test-client-id' || clientSecret !== 'test-client-secret') {
      return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
    }

    return NextResponse.json({
      access_token: 'mock-access-token-' + Date.now(),
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour
      refresh_token: 'mock-refresh-token-' + Date.now(),
    });
  }

  console.log('[Mock Brightspace] Unknown POST path:', pathStr);
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Current user (whoami)
  if (pathStr === 'd2l/api/lp/1.0/users/whoami' || pathStr.match(/^d2l\/api\/lp\/[\d.]+\/users\/whoami$/)) {
    return NextResponse.json(MOCK_USER);
  }

  // User enrollments
  if (pathStr.match(/^d2l\/api\/lp\/[\d.]+\/enrollments\/myenrollments\/?$/)) {
    return NextResponse.json({
      Items: MOCK_ENROLLMENTS,
      PagingInfo: {
        Bookmark: null,
        HasMoreItems: false,
      },
    });
  }

  // Dropbox folders for a course
  const dropboxMatch = pathStr.match(/^d2l\/api\/le\/[\d.]+\/(\d+)\/dropbox\/folders\/?$/);
  if (dropboxMatch) {
    const courseId = parseInt(dropboxMatch[1]);
    const folders = MOCK_DROPBOX_FOLDERS[courseId] || [];
    return NextResponse.json(folders);
  }

  // Dropbox submission for a folder
  const submissionMatch = pathStr.match(/^d2l\/api\/le\/[\d.]+\/(\d+)\/dropbox\/folders\/(\d+)\/submissions\/mysubmissions\/?$/);
  if (submissionMatch) {
    const folderId = parseInt(submissionMatch[2]);
    const submission = MOCK_SUBMISSIONS[folderId];
    if (submission) {
      return NextResponse.json([submission]);
    }
    return NextResponse.json([]);
  }

  // Grade items for a course
  const gradeItemsMatch = pathStr.match(/^d2l\/api\/le\/[\d.]+\/(\d+)\/grades\/\/?$/);
  if (gradeItemsMatch) {
    const courseId = parseInt(gradeItemsMatch[1]);
    const items = MOCK_GRADE_ITEMS[courseId] || [];
    return NextResponse.json(items);
  }

  // Also match grade items with different format
  const gradeItemsAltMatch = pathStr.match(/^d2l\/api\/le\/[\d.]+\/grades\/(\d+)\/items\/?$/);
  if (gradeItemsAltMatch) {
    const courseId = parseInt(gradeItemsAltMatch[1]);
    const items = MOCK_GRADE_ITEMS[courseId] || [];
    return NextResponse.json(items);
  }

  // My grades for a course
  const myGradesMatch = pathStr.match(/^d2l\/api\/le\/[\d.]+\/(\d+)\/grades\/values\/myGradeValues\/?$/);
  if (myGradesMatch) {
    const courseId = parseInt(myGradesMatch[1]);
    const gradeItems = MOCK_GRADE_ITEMS[courseId] || [];
    const values = gradeItems
      .filter(item => MOCK_GRADE_VALUES[item.Id] !== null)
      .map(item => {
        const gradeValue = MOCK_GRADE_VALUES[item.Id];
        return {
          UserId: 12345,
          OrgUnitId: courseId,
          GradeObjectIdentifier: item.Id,
          GradeObjectName: item.Name,
          DisplayedGrade: gradeValue ? `${gradeValue.PointsNumerator}/${gradeValue.PointsDenominator}` : '-',
          PointsNumerator: gradeValue?.PointsNumerator ?? null,
          PointsDenominator: gradeValue?.PointsDenominator ?? null,
          WeightedNumerator: gradeValue?.WeightedNumerator ?? null,
          WeightedDenominator: gradeValue?.WeightedDenominator ?? null,
          GradedDate: gradeValue ? new Date().toISOString() : null,
        };
      });
    return NextResponse.json(values);
  }

  // Calendar events
  if (pathStr.match(/^d2l\/api\/le\/[\d.]+\/calendar\/events\/myEvents\/?$/)) {
    return NextResponse.json(MOCK_CALENDAR_EVENTS);
  }

  // Also handle org-level calendar
  if (pathStr.match(/^d2l\/api\/lp\/[\d.]+\/calendar\/events\/?$/)) {
    return NextResponse.json(MOCK_CALENDAR_EVENTS);
  }

  // News items for a course
  const newsMatch = pathStr.match(/^d2l\/api\/le\/[\d.]+\/(\d+)\/news\/?$/);
  if (newsMatch) {
    const courseId = parseInt(newsMatch[1]);
    const news = MOCK_NEWS_ITEMS[courseId] || [];
    return NextResponse.json(news);
  }

  console.log('[Mock Brightspace] Unknown GET path:', pathStr);
  return NextResponse.json({ error: 'Not found', path: pathStr }, { status: 404 });
}
