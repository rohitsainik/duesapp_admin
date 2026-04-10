// app/api/depositLoan/route.ts
import { NextRequest, NextResponse } from "next/server";       // update path as needed
import { prisma } from "@/lib/dbConnect";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/getSession";

export async function POST(req: NextRequest) {
  try {
    // 1) Admin from session
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adminUserId = session.id;

    // 2) Input
    const body = await req.json();
    const loanId: string | undefined = body?.loanId;
    const depositPrincipalNum = Number(body?.depositPrincipal ?? 0);
    const depositInterestNum  = Number(body?.depositInterest  ?? 0);
    const note: string | undefined = body?.note;
    const depositedAtIso: string | undefined = body?.depositedAt; // optional
    const depositedAt = depositedAtIso ? new Date(depositedAtIso) : new Date();

    if (!loanId) return NextResponse.json({ error: "loanId is required" }, { status: 400 });
    if (isNaN(depositPrincipalNum) || isNaN(depositInterestNum)) {
      return NextResponse.json({ error: "Invalid numbers" }, { status: 400 });
    }
    if (depositPrincipalNum < 0 || depositInterestNum < 0) {
      return NextResponse.json({ error: "Amounts must be >= 0" }, { status: 400 });
    }
    if (depositPrincipalNum === 0 && depositInterestNum === 0) {
      return NextResponse.json({ error: "Nothing to deposit" }, { status: 400 });
    }
    if (isNaN(depositedAt.getTime())) {
      return NextResponse.json({ error: "Invalid depositedAt" }, { status: 400 });
    }

    const amountNum = depositPrincipalNum + depositInterestNum;

    // 3) Fetch loan (for snapshot)
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      select: {
        id: true,
        borrowerId: true,
        principal: true,
        rate: true,
        months: true,
        interestMethod: true,
      },
    });
    if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

    // 4) Update loan totals (additive)
    const incData: Prisma.LoanUpdateInput = {};
    if (depositPrincipalNum) incData.depositedPrincipal = { increment: new Prisma.Decimal(depositPrincipalNum) };
    if (depositInterestNum)  incData.depositedInterest  = { increment: new Prisma.Decimal(depositInterestNum)  };

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: incData,
      select: {
        id: true,
        depositedPrincipal: true,
        depositedInterest: true,
        updatedAt: true,
      },
    });

    // 5) Create payment receipt (manual) using snapshot from step 3
    const receipt = await prisma.paymentReceiptManual.create({
      data: {
        loanId,
        adminUserId,
        depositedAt,
        amount: new Prisma.Decimal(amountNum),
        depositPrincipal: depositPrincipalNum ? new Prisma.Decimal(depositPrincipalNum) : null,
        depositInterest:  depositInterestNum  ? new Prisma.Decimal(depositInterestNum)  : null,
        note: note ?? `Total Principal Deposited: ${depositPrincipalNum} and Total Interest Deposited: ${depositInterestNum}`,
        // snapshot fields (pre-update loan terms)
        borrowerUserId: loan.borrowerId,
        principal: loan.principal,
        rate: loan.rate,
        months: loan.months,
        interestMethod: String(loan.interestMethod),
      },
    });

    return NextResponse.json({ loan: updatedLoan, receipt }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    // Prisma P2025 means not found on update, but we checked earlier; still handle gracefully
    const code = (err as { code?: string } | null)?.code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to record deposit & receipt";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}