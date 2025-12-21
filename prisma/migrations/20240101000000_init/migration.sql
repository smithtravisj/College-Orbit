-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CollegeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collegeName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollegeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Course" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "meetingTimes" JSONB NOT NULL DEFAULT '[]',
    "links" JSONB NOT NULL DEFAULT '[]',
    "colorTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Deadline" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "courseId" TEXT,
    "dueAt" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "links" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Exam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "courseId" TEXT,
    "examAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "links" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExamReminder" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationId" TEXT,

    CONSTRAINT "ExamReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExcludedDate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExcludedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeatureRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Folder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "courseId" TEXT,
    "colorTag" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GpaEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "courseName" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "university" TEXT,

    CONSTRAINT "GpaEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IssueReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "plainText" TEXT NOT NULL DEFAULT '',
    "folderId" TEXT,
    "courseId" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "links" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "collegeRequestId" TEXT,
    "featureRequestId" TEXT,
    "issueReportId" TEXT,
    "examId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RateLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dueSoonWindowDays" INTEGER NOT NULL DEFAULT 7,
    "weekStartsOn" TEXT NOT NULL DEFAULT 'Sun',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "enableNotifications" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "university" TEXT,
    "visibleDashboardCards" JSONB DEFAULT '["nextClass", "dueSoon", "overview", "todayTasks", "quickLinks", "upcomingWeek"]',
    "visiblePages" JSONB DEFAULT '["Dashboard", "Calendar", "Tasks", "Deadlines", "Exams", "Courses", "Tools", "Settings"]',
    "visibleToolsCards" JSONB DEFAULT '["quickLinks", "gpaCalculator"]',
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "examReminders" JSONB DEFAULT '[{"unit": "days", "value": 7, "enabled": true}, {"unit": "days", "value": 1, "enabled": true}, {"unit": "hours", "value": 3, "enabled": true}]',

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "courseId" TEXT,
    "dueAt" TIMESTAMP(3),
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "links" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "resetPasswordToken" TEXT,
    "resetPasswordTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "public"."AnalyticsEvent"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "public"."AnalyticsEvent"("eventType" ASC);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "public"."AnalyticsEvent"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "public"."AnalyticsEvent"("userId" ASC);

-- CreateIndex
CREATE INDEX "CollegeRequest_status_idx" ON "public"."CollegeRequest"("status" ASC);

-- CreateIndex
CREATE INDEX "CollegeRequest_userId_idx" ON "public"."CollegeRequest"("userId" ASC);

-- CreateIndex
CREATE INDEX "Course_userId_idx" ON "public"."Course"("userId" ASC);

-- CreateIndex
CREATE INDEX "Deadline_courseId_idx" ON "public"."Deadline"("courseId" ASC);

-- CreateIndex
CREATE INDEX "Deadline_status_idx" ON "public"."Deadline"("status" ASC);

-- CreateIndex
CREATE INDEX "Deadline_userId_idx" ON "public"."Deadline"("userId" ASC);

-- CreateIndex
CREATE INDEX "Exam_courseId_idx" ON "public"."Exam"("courseId" ASC);

-- CreateIndex
CREATE INDEX "Exam_examAt_idx" ON "public"."Exam"("examAt" ASC);

-- CreateIndex
CREATE INDEX "Exam_status_idx" ON "public"."Exam"("status" ASC);

-- CreateIndex
CREATE INDEX "Exam_userId_idx" ON "public"."Exam"("userId" ASC);

-- CreateIndex
CREATE INDEX "ExamReminder_examId_idx" ON "public"."ExamReminder"("examId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ExamReminder_examId_reminderType_key" ON "public"."ExamReminder"("examId" ASC, "reminderType" ASC);

-- CreateIndex
CREATE INDEX "ExamReminder_sentAt_idx" ON "public"."ExamReminder"("sentAt" ASC);

-- CreateIndex
CREATE INDEX "ExcludedDate_courseId_idx" ON "public"."ExcludedDate"("courseId" ASC);

-- CreateIndex
CREATE INDEX "ExcludedDate_date_idx" ON "public"."ExcludedDate"("date" ASC);

-- CreateIndex
CREATE INDEX "ExcludedDate_userId_idx" ON "public"."ExcludedDate"("userId" ASC);

-- CreateIndex
CREATE INDEX "FeatureRequest_status_idx" ON "public"."FeatureRequest"("status" ASC);

-- CreateIndex
CREATE INDEX "FeatureRequest_userId_idx" ON "public"."FeatureRequest"("userId" ASC);

-- CreateIndex
CREATE INDEX "Folder_courseId_idx" ON "public"."Folder"("courseId" ASC);

-- CreateIndex
CREATE INDEX "Folder_parentId_idx" ON "public"."Folder"("parentId" ASC);

-- CreateIndex
CREATE INDEX "Folder_userId_idx" ON "public"."Folder"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Folder_userId_name_parentId_key" ON "public"."Folder"("userId" ASC, "name" ASC, "parentId" ASC);

-- CreateIndex
CREATE INDEX "GpaEntry_university_idx" ON "public"."GpaEntry"("university" ASC);

-- CreateIndex
CREATE INDEX "GpaEntry_userId_idx" ON "public"."GpaEntry"("userId" ASC);

-- CreateIndex
CREATE INDEX "IssueReport_status_idx" ON "public"."IssueReport"("status" ASC);

-- CreateIndex
CREATE INDEX "IssueReport_userId_idx" ON "public"."IssueReport"("userId" ASC);

-- CreateIndex
CREATE INDEX "Note_courseId_idx" ON "public"."Note"("courseId" ASC);

-- CreateIndex
CREATE INDEX "Note_folderId_idx" ON "public"."Note"("folderId" ASC);

-- CreateIndex
CREATE INDEX "Note_isPinned_idx" ON "public"."Note"("isPinned" ASC);

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "public"."Note"("userId" ASC);

-- CreateIndex
CREATE INDEX "Notification_collegeRequestId_idx" ON "public"."Notification"("collegeRequestId" ASC);

-- CreateIndex
CREATE INDEX "Notification_examId_idx" ON "public"."Notification"("examId" ASC);

-- CreateIndex
CREATE INDEX "Notification_featureRequestId_idx" ON "public"."Notification"("featureRequestId" ASC);

-- CreateIndex
CREATE INDEX "Notification_issueReportId_idx" ON "public"."Notification"("issueReportId" ASC);

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "public"."Notification"("read" ASC);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId" ASC);

-- CreateIndex
CREATE INDEX "RateLimit_resetAt_idx" ON "public"."RateLimit"("resetAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_userId_endpoint_key" ON "public"."RateLimit"("userId" ASC, "endpoint" ASC);

-- CreateIndex
CREATE INDEX "RateLimit_userId_idx" ON "public"."RateLimit"("userId" ASC);

-- CreateIndex
CREATE INDEX "Settings_userId_idx" ON "public"."Settings"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "public"."Settings"("userId" ASC);

-- CreateIndex
CREATE INDEX "Task_courseId_idx" ON "public"."Task"("courseId" ASC);

-- CreateIndex
CREATE INDEX "Task_pinned_idx" ON "public"."Task"("pinned" ASC);

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "public"."Task"("status" ASC);

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "public"."Task"("userId" ASC);

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "public"."User"("resetPasswordToken" ASC);

-- AddForeignKey
ALTER TABLE "public"."CollegeRequest" ADD CONSTRAINT "CollegeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Course" ADD CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Deadline" ADD CONSTRAINT "Deadline_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Deadline" ADD CONSTRAINT "Deadline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Exam" ADD CONSTRAINT "Exam_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Exam" ADD CONSTRAINT "Exam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamReminder" ADD CONSTRAINT "ExamReminder_examId_fkey" FOREIGN KEY ("examId") REFERENCES "public"."Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExcludedDate" ADD CONSTRAINT "ExcludedDate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExcludedDate" ADD CONSTRAINT "ExcludedDate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeatureRequest" ADD CONSTRAINT "FeatureRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GpaEntry" ADD CONSTRAINT "GpaEntry_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GpaEntry" ADD CONSTRAINT "GpaEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueReport" ADD CONSTRAINT "IssueReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_collegeRequestId_fkey" FOREIGN KEY ("collegeRequestId") REFERENCES "public"."CollegeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_examId_fkey" FOREIGN KEY ("examId") REFERENCES "public"."Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "public"."FeatureRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_issueReportId_fkey" FOREIGN KEY ("issueReportId") REFERENCES "public"."IssueReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RateLimit" ADD CONSTRAINT "RateLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

