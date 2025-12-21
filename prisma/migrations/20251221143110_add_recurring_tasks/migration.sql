-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "instanceDate" TIMESTAMP(3),
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringPatternId" TEXT;

-- CreateTable
CREATE TABLE "RecurringPattern" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recurrenceType" TEXT NOT NULL,
    "intervalDays" INTEGER,
    "endDate" TIMESTAMP(3),
    "occurrenceCount" INTEGER,
    "lastGenerated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instanceCount" INTEGER NOT NULL DEFAULT 0,
    "taskTemplate" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RecurringPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringPattern_userId_idx" ON "RecurringPattern"("userId");

-- CreateIndex
CREATE INDEX "RecurringPattern_isActive_idx" ON "RecurringPattern"("isActive");

-- CreateIndex
CREATE INDEX "Task_recurringPatternId_idx" ON "Task"("recurringPatternId");

-- CreateIndex
CREATE INDEX "Task_isRecurring_idx" ON "Task"("isRecurring");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_recurringPatternId_fkey" FOREIGN KEY ("recurringPatternId") REFERENCES "RecurringPattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringPattern" ADD CONSTRAINT "RecurringPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
