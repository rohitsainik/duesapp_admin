import { NextResponse } from "next/server";
import { prisma } from "@/lib/dbConnect";

// GET /api/loans/:userId
export async function GET(
  _req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        loansBorrowed: {
          select: {
            id: true,
            principal: true,       // Decimal
            rate: true,            // Decimal (you used @db.Decimal(8,4))
            months: true,
            startDate: true,       // Date
            interestMethod: true,  // enum
            totalInterest: true,   // Decimal | null
            totalPayable: true,    // Decimal | null
            depositedInterest:true,
            depositedPrincipal:true,
            status:true
          },
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Serialize Prisma Decimal & Date fields safely
    const loans = (user.loansBorrowed || []).map((l) => ({
      id: l.id,
      principal: l.principal?.toNumber?.() ?? Number(l.principal),
      rate: l.rate?.toNumber?.() ?? Number(l.rate),
      months: l.months,
      start: new Date(l.startDate).toISOString().slice(0, 10),
      interestMethod: l.interestMethod,
      totalInterest:
        l.totalInterest == null ? null : l.totalInterest.toNumber?.() ?? Number(l.totalInterest),
      totalPayable:
        l.totalPayable == null ? null : l.totalPayable.toNumber?.() ?? Number(l.totalPayable),
      depositedPrincipal:
        l.depositedPrincipal == null ? 0 : l.depositedPrincipal.toNumber?.() ?? Number(l.depositedPrincipal),
      depositedInterest:
        l.depositedInterest == null ? 0 : l.depositedInterest.toNumber?.() ?? Number(l.depositedInterest),
        status: l.status
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      loans,
    });
  } catch (error) {
    console.error("Error fetching loans by userId:", error);
    return NextResponse.json(
      { error: "Failed to fetch user loan details" },
      { status: 500 }
    );
  }
}