-- CreateEnum
CREATE TYPE "TransactionKind" AS ENUM ('ADVISOR_SESSION', 'MARKETPLACE_SALE', 'PLAN_ASSESSMENT');

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "kind" "TransactionKind" NOT NULL,
    "payerId" TEXT NOT NULL,
    "payeeId" TEXT,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "referenceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_kind_createdAt_idx" ON "transactions"("kind", "createdAt");
CREATE INDEX "transactions_payerId_idx" ON "transactions"("payerId");
CREATE INDEX "transactions_payeeId_idx" ON "transactions"("payeeId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
