import { NextResponse } from "next/server";
import { prisma } from "@/lib/dbConnect";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    const role = (payload.role as string ?? "").toLowerCase();
    const adminId = payload.id as string;

    if (role !== "admin" && role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const usersWithLoans = await prisma.user.findMany({
      where: { adminId },
      select: {
        id: true,
        userId: true,
        name: true,
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
            totalInterest: true,
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