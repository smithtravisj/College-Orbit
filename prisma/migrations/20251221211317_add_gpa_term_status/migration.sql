-- AlterTable
ALTER TABLE "GpaEntry" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'final',
ADD COLUMN     "term" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "GpaEntry_term_idx" ON "GpaEntry"("term");

-- CreateIndex
CREATE INDEX "GpaEntry_status_idx" ON "GpaEntry"("status");
