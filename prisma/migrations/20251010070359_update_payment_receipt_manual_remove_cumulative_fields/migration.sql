/*
  Warnings:

  - You are about to drop the column `depositedInterest` on the `PaymentReceiptManual` table. All the data in the column will be lost.
  - You are about to drop the column `depositedPrincipal` on the `PaymentReceiptManual` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."PaymentReceiptManual" DROP COLUMN "depositedInterest",
DROP COLUMN "depositedPrincipal";
