import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Prisma } from "@prisma/client";

// GET /api/users?q=&take=&cursor=&adminId= (adminId allowed only for SUPER_ADMIN)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role: rawRole, id: callerId } = session.user as { role?: string; id?: string };
    const role = (rawRole ?? "").toString().toUpperCase();
    if (!callerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const takeParam = parseInt(url.searchParams.get("take") || "20", 10);
    const take = Number.isFinite(takeParam) && takeParam > 0 && takeParam <= 100 ? takeParam : 20;
    const cursor = url.searchParams.get("cursor") || undefined;

    // super admin may inspect another admin’s users
    let targetAdminId: string | undefined;
    if (role === "SUPER_ADMIN") {
      targetAdminId = url.searchParams.get("adminId") || undefined; // optional
    } else if (role === "ADMIN") {
      targetAdminId = callerId; // strictly the caller
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build where clause
    const where: Prisma.UserWhereInput = { role: "USER" };
    if (targetAdminId) where.adminId = targetAdminId;

    if (q) {
      // basic OR search on name/email/phone/location/userId
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { userId: { contains: q, mode: "insensitive" } },
      ];
    }

    const result = await prisma.user.findMany({
      where,
      take: take + 1, // fetch one extra to know if there is next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        phone: true,
        location: true,
        role: true,
        adminId: true,
        createdAt: true,
        _count:{
          select:{
            loansBorrowed:true
          }
        }
      },
    });

    const hasNext = result.length > take;
    const items = hasNext ? result.slice(0, take) : result;
    const nextCursor = hasNext ? items[items.length - 1].id : null;

    return NextResponse.json({
      ok: true,
      count: items.length,
      nextCursor,
      users: items,
    });
  } catch (err) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}