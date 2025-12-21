-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "visiblePagesOrder" JSONB DEFAULT '["Dashboard", "Calendar", "Tasks", "Deadlines", "Exams", "Courses", "Tools"]';
