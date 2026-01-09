-- CreateTable
CREATE TABLE "CustomQuickLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomQuickLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomQuickLink_userId_idx" ON "CustomQuickLink"("userId");

-- CreateIndex
CREATE INDEX "CustomQuickLink_university_idx" ON "CustomQuickLink"("university");

-- AddForeignKey
ALTER TABLE "CustomQuickLink" ADD CONSTRAINT "CustomQuickLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
