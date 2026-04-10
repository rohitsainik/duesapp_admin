import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { prisma } from "@/lib/dbConnect";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

const MAX_TAKE     = 100;
const DEFAULT_TAKE = 20;

// GET /api/users?q=&take=&cursor=&adminId=
// adminId filter is only respected for SUPER_ADMIN.
// SUPER_ADMIN with no adminId param returns ALL users across all admins.
export async function GET(req: Request) {
  try {
    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ── 2. Role from DB — source of truth ────────────────────────────────────
    const caller = await prisma.user.findUnique({
      where: { id: session.id },
      select: { role: true },
    });

    if (!caller)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const myRole = caller.role; // "SUPER_ADMIN" | "ADMIN" | "USER"

    // ── 3. Parse query params ────────────────────────────────────────────────
    const url       = new URL(req.url);
    const q         = (url.searchParams.get("q") || "").trim();
    const takeParam = parseInt(url.searchParams.get("take") || String(DEFAULT_TAKE), 10);
    const take      = Number.isFinite(takeParam) && takeParam > 0 && takeParam <= MAX_TAKE
      ? takeParam
      : DEFAULT_TAKE;
    const cursor = url.searchParams.get("cursor") || undefined;

    // ── 4. RBAC — scope to the right adminId ─────────────────────────────────
    let targetAdminId: string | undefined;

    if (myRole === "SUPER_ADMIN") {
      // SUPER_ADMIN may optionally filter by a specific admin's users.
      // No adminId param → returns all users across all admins.
      targetAdminId = url.searchParams.get("adminId") || undefined;
    } else if (myRole === "ADMIN") {
      // ADMIN is strictly scoped to their own users only.
      targetAdminId = session.id;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 5. Build where clause ────────────────────────────────────────────────
    const where: Prisma.UserWhereInput = { role: "USER" };

    if (targetAdminId) where.adminId = targetAdminId;

    if (q) {
      where.OR = [
        { name:     { contains: q, mode: "insensitive" } },
        { email:    { contains: q, mode: "insensitive" } },
        { phone:    { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { userId:   { contains: q, mode: "insensitive" } },
      ];
    }

    // ── 6. Query ─────────────────────────────────────────────────────────────
    const result = await prisma.user.findMany({
      where,
      take: take + 1, // fetch one extra to determine if next page exists
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
        _count: {
          select: { loansBorrowed: true },
        },
      },
    });

    // ── 7. Cursor pagination ─────────────────────────────────────────────────
    const hasNext   = result.length > take;
    const items     = hasNext ? result.slice(0, take) : result;
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