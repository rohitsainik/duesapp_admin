import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/dbConnect";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { loanId } = await req.json();
    if (!loanId) {
      return NextResponse.json({ error: "Missing loanId" }, { status: 400 });
    }

    console.log("Fetching loan details for ID:", loanId);

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        borrower: {
          select: { id: true, name: true, email: true, phone: true },
        },
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!loan) {
      return NextResponse.json(
        { error: "Loan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ loan }, { status: 200 });
  } catch (err: unknown) {
    console.error("Error in getLoanByLoanId API:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
