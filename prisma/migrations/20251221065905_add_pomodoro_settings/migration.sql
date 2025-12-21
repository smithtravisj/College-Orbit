-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "pomodoroBreakDuration" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "pomodoroIsMuted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pomodoroWorkDuration" INTEGER NOT NULL DEFAULT 25;
