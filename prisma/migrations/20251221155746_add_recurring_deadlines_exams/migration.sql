-- AlterTable
ALTER TABLE "Deadline" ADD COLUMN     "instanceDate" TIMESTAMP(3),
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringPatternId" TEXT;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "instanceDate" TIMESTAMP(3),
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringPatternId" TEXT;

-- CreateTable
CREATE TABLE "RecurringDeadlinePattern" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recurrenceType" TEXT NOT NULL,
    "intervalDays" INTEGER,
    "daysOfWeek" JSONB NOT NULL DEFAULT '[]',
    "daysOfMonth" JSONB NOT NULL DEFAULT '[]',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "occurrenceCount" INTEGER,
    "lastGenerated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instanceCount" INTEGER NOT NULL DEFAULT 0,
    "deadlineTemplate" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RecurringDeadlinePattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringExamPattern" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recurrenceType" TEXT NOT NULL,
    "intervalDays" INTEGER,
    "daysOfWeek" JSONB NOT NULL DEFAULT '[]',
    "daysOfMonth" JSONB NOT NULL DEFAULT '[]',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "occurrenceCount" INTEGER,
    "lastGenerated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instanceCount" INTEGER NOT NULL DEFAULT 0,
    "examTemplate" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RecurringExamPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringDeadlinePattern_userId_idx" ON "RecurringDeadlinePattern"("userId");

-- CreateIndex
CREATE INDEX "RecurringDeadlinePattern_isActive_idx" ON "RecurringDeadlinePattern"("isActive");

-- CreateIndex
CREATE INDEX "RecurringExamPattern_userId_idx" ON "RecurringExamPattern"("userId");

-- CreateIndex
CREATE INDEX "RecurringExamPattern_isActive_idx" ON "RecurringExamPattern"("isActive");

-- CreateIndex
CREATE INDEX "Deadline_recurringPatternId_idx" ON "Deadline"("recurringPatternId");

-- CreateIndex
CREATE INDEX "Deadline_isRecurring_idx" ON "Deadline"("isRecurring");

-- CreateIndex
CREATE INDEX "Exam_recurringPatternId_idx" ON "Exam"("recurringPatternId");

-- CreateIndex
CREATE INDEX "Exam_isRecurring_idx" ON "Exam"("isRecurring");

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_recurringPatternId_fkey" FOREIGN KEY ("recurringPatternId") REFERENCES "RecurringDeadlinePattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringDeadlinePattern" ADD CONSTRAINT "RecurringDeadlinePattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExamPattern" ADD CONSTRAINT "RecurringExamPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_recurringPatternId_fkey" FOREIGN KEY ("recurringPatternId") REFERENCES "RecurringExamPattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;
