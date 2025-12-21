-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "toolsCardsOrder" JSONB DEFAULT '["pomodoroTimer", "gradeTracker", "gpaTrendChart", "whatIfProjector", "gpaCalculator", "tools_quickLinks"]';
