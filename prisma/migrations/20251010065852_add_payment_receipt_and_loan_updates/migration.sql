-- AlterTable
ALTER TABLE "public"."Loan" ADD COLUMN     "depositedInterest" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "depositedPrincipal" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."PaymentReceiptManual" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "depositedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(18,2) NOT NULL,
    "depositPrincipal" DECIMAL(18,2),
    "depositInterest" DECIMAL(18,2),
    "note" TEXT,
    "borrowerUserId" TEXT,
    "principal" DECIMAL(18,2),
    "rate" DECIMAL(8,4),
    "months" INTEGER,
    "interestMethod" TEXT,
    "depositedPrincipal" DECIMAL(18,2),
    "depositedInterest" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReceiptManual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentReceiptManual_loanId_createdAt_idx" ON "public"."PaymentReceiptManual"("loanId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentReceiptManual_adminUserId_idx" ON "public"."PaymentReceiptManual"("adminUserId");
