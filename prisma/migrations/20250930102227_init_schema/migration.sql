-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."LoanStatus" AS ENUM ('ACTIVE', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."InterestMethod" AS ENUM ('SIMPLE', 'MONTHLY_FLAT', 'COMPOUND', 'REDUCING');

-- CreateEnum
CREATE TYPE "public"."CollateralStatus" AS ENUM ('PLEDGED', 'RELEASED', 'SEIZED');

-- CreateEnum
CREATE TYPE "public"."CollateralType" AS ENUM ('PROPERTY', 'GOLD', 'VEHICLE', 'CASH_FD', 'SECURITIES', 'OTHER');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "passwordHash" TEXT NOT NULL,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Loan" (
    "id" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "principal" DECIMAL(18,2) NOT NULL,
    "rate" DECIMAL(8,4) NOT NULL,
    "months" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "interestMethod" "public"."InterestMethod" NOT NULL DEFAULT 'SIMPLE',
    "lockIn" BOOLEAN NOT NULL DEFAULT false,
    "minMonthsFloor" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalInterest" DECIMAL(18,2),
    "totalPayable" DECIMAL(18,2),
    "notes" TEXT,
    "isSecured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Collateral" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "type" "public"."CollateralType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedValue" DECIMAL(18,2) NOT NULL,
    "status" "public"."CollateralStatus" NOT NULL DEFAULT 'PLEDGED',
    "appraisalAt" TIMESTAMP(3),
    "notes" TEXT,
    "documentUrls" VARCHAR(512)[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collateral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "public"."User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_adminId_idx" ON "public"."User"("adminId");

-- CreateIndex
CREATE INDEX "Loan_borrowerId_idx" ON "public"."Loan"("borrowerId");

-- CreateIndex
CREATE INDEX "Loan_adminId_idx" ON "public"."Loan"("adminId");

-- CreateIndex
CREATE INDEX "Loan_status_idx" ON "public"."Loan"("status");

-- CreateIndex
CREATE INDEX "Loan_startDate_idx" ON "public"."Loan"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Collateral_loanId_idx" ON "public"."Collateral"("loanId");

-- CreateIndex
CREATE INDEX "Collateral_type_status_idx" ON "public"."Collateral"("type", "status");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Collateral" ADD CONSTRAINT "Collateral_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
