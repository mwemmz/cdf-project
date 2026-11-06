-- CreateTable
CREATE TABLE "product_threads" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_threads_sellerId_idx" ON "product_threads"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "product_threads_productId_buyerId_key" ON "product_threads"("productId", "buyerId");

-- CreateIndex
CREATE INDEX "product_messages_threadId_createdAt_idx" ON "product_messages"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "product_threads" ADD CONSTRAINT "product_threads_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_threads" ADD CONSTRAINT "product_threads_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_threads" ADD CONSTRAINT "product_threads_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_messages" ADD CONSTRAINT "product_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "product_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_messages" ADD CONSTRAINT "product_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
