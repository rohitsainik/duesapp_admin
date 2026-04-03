// src/app/api/loans/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // get all users under this admin, with their loans
    const usersWithLoans = await prisma.user.findMany({
      where: {
        adminId: session.user.id,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        // adjust relation name according to your schema:
        loansBorrowed: {
          select: {
            id: true,
            principal: true,
            rate: true,
            months: true,
            interestMethod: true,
            totalPayable: true,
            status: true,
            createdAt: true,
            totalInterest:true
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(usersWithLoans);
  } catch (error) {
    console.error("Error fetching loans:", error);
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 });
  }
}