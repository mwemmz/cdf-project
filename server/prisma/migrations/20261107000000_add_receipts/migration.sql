-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "receiptNo" TEXT,
ADD COLUMN "method" TEXT NOT NULL DEFAULT 'SIMULATED',
ADD COLUMN "provider" TEXT,
ADD COLUMN "phoneMasked" TEXT,
ADD COLUMN "providerRef" TEXT;

-- Give existing transactions a receipt number
UPDATE "transactions" SET "receiptNo" = 'FP-' || to_char("createdAt", 'YYYYMMDD') || '-' || upper(substr("id", length("id") - 5)) WHERE "receiptNo" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_receiptNo_key" ON "transactions"("receiptNo");
