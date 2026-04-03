// src/app/api/loan/getLoanDetails/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/dbConnect";

// GET /api/loan/getLoanDetails?userId=...
// Returns: { user, loans: [...], receipts: [...] }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // 1) Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2) Fetch loans for this user
    const loansRaw = await prisma.loan.findMany({
      where: { borrowerId: userId },
      select: {
        id: true,
        principal: true,
        rate: true,
        months: true,
        startDate: true,
        interestMethod: true,
        totalInterest: true,
        totalPayable: true,
        depositedPrincipal: true,
        depositedInterest: true,
        status: true,
        adminId: true,
      },
      orderBy: { startDate: "desc" },
    });

    const loans = loansRaw.map((l) => ({
      id: l.id,
      principal: Number(l.principal),
      rate: Number(l.rate),
      months: l.months,
      start: l.startDate.toISOString().slice(0, 10),
      interestMethod: String(l.interestMethod),
      totalInterest: l.totalInterest == null ? 0 : Number(l.totalInterest),
      totalPayable: l.totalPayable == null ? Number(l.principal) : Number(l.totalPayable),
      depositedPrincipal: l.depositedPrincipal == null ? 0 : Number(l.depositedPrincipal),
      depositedInterest: l.depositedInterest == null ? 0 : Number(l.depositedInterest),
      status: l.status,
      adminId: l.adminId,
    }));

    // 3) Fetch manual payment receipts for those loans
    const loanIds = loans.map((l) => l.id);
    const receiptsRaw = loanIds.length
      ? await prisma.paymentReceiptManual.findMany({
          where: { loanId: { in: loanIds } },
          orderBy: [{ depositedAt: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            loanId: true,
            amount: true,
            depositPrincipal: true,
            depositInterest: true,
            note: true,
            adminUserId: true,
            depositedAt: true,
            createdAt: true,
            principal: true,
          },
        })
      : [];

    const receipts = receiptsRaw.map((r) => ({
      id: r.id,
      loanId: r.loanId,
      amount: Number(r.amount),
      depositPrincipal: r.depositPrincipal == null ? null : Number(r.depositPrincipal),
      depositInterest: r.depositInterest == null ? null : Number(r.depositInterest),
      note: r.note ?? null,
      recordedBy: r.adminUserId,
      depositedAt: r.depositedAt.toISOString(),
      date: r.depositedAt.toISOString().slice(0, 10),
      principal: r.principal == null ? null : Number(r.principal),
    }));

    return NextResponse.json({ user, loans, receipts }, { status: 200 });
  } catch (err: unknown) {
    console.error("Error in getLoanByLoanId API:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}