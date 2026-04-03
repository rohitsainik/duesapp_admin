import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/dbConnect";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { loanId } = await req.json();
    console.log("this is the loanId",loanId);
    
    if (!loanId) {
      return NextResponse.json({ error: "Missing loanId" }, { status: 400 });
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { borrower: true },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    if (loan.adminId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    if (loan.status === "CLOSED") {
      return NextResponse.json({ error: "Loan already closed" }, { status: 409 });
    }

    const { updatedLoan, receipt } = await prisma.$transaction(async (tx) => {
      // Compute splits before update using the existing loan snapshot
      const principalDec = new Prisma.Decimal(loan.principal);
      const interestDec = new Prisma.Decimal(loan.totalInterest ?? 0);

      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: "CLOSED",
          depositedPrincipal: principalDec,
          depositedInterest: interestDec,
          totalPayable: new Prisma.Decimal(0),
          notes: `${loan.notes ? loan.notes + " | " : ""}Loan is cleared`,
          updatedAt: new Date(),
        },
      });

      const totalInt: number = Number(loan.totalInterest ?? 0);
      const totalPrin: number = Number(loan.principal ?? 0);
      const depositedInt: number = Number(loan.depositedInterest ?? 0);
      const depositedPrin: number = Number(loan.depositedPrincipal ?? 0);

      const totalInterest: number = totalInt - depositedInt;
      const totalPrincipal: number = totalPrin - depositedPrin;

      const receipt = await prisma.paymentReceiptManual.create({
        data: {
          loanId,
          adminUserId: session.user.id,
          amount: totalInterest + totalPrincipal,
          depositPrincipal: totalPrincipal,
          depositInterest: totalInterest,
          note: "Loan cleared",
          borrowerUserId: loan.borrowerId,
          principal: loan.principal,
          rate: loan.rate,
          months: loan.months,
          interestMethod: loan.interestMethod,
        },
      });

      return { updatedLoan, receipt };
    });

    return NextResponse.json({
      success: true,
      message: "Loan cleared successfully",
      loan: updatedLoan,
      receipt,
    });
  } catch (err: unknown) {
    console.error("Error in clearLoan API:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
