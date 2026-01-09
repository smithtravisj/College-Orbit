-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "category" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT,
    "price" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShoppingItem_userId_idx" ON "ShoppingItem"("userId");

-- CreateIndex
CREATE INDEX "ShoppingItem_listType_idx" ON "ShoppingItem"("listType");

-- CreateIndex
CREATE INDEX "ShoppingItem_category_idx" ON "ShoppingItem"("category");

-- CreateIndex
CREATE INDEX "ShoppingItem_checked_idx" ON "ShoppingItem"("checked");

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
