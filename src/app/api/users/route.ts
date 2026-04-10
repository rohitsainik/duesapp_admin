import { NextResponse } from "next/server";
import { prisma } from "@/lib/dbConnect";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/getSession";

export const runtime = "nodejs";

const VALID_ROLES = ["USER", "ADMIN", "SUPER_ADMIN"] as const;
type Role = (typeof VALID_ROLES)[number];

export async function POST(req: Request) {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── 2. Get caller's role directly from DB — source of truth ───────────────
  const caller = await prisma.user.findUnique({
    where: { id: session.id },
    select: { role: true },
  });

  if (!caller)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myRole = caller.role; // "SUPER_ADMIN" | "ADMIN" | "USER" — exact DB enum

  // ── 3. Parse & validate body ───────────────────────────────────────────────
  const body = await req.json().catch(() => null);

  if (!body)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const { userId, name, email, phone, password, role, location } = body;

  if (!userId || !name || !password || !role) {
    return NextResponse.json(
      { error: "userId, name, password, role are required" },
      { status: 400 }
    );
  }

  // ── 4. Whitelist role value ────────────────────────────────────────────────
  if (!VALID_ROLES.includes(role as Role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // ── 5. RBAC ────────────────────────────────────────────────────────────────
  if (role === "SUPER_ADMIN" && myRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only SUPER_ADMIN can create SUPER_ADMIN" },
      { status: 403 }
    );
  }
  if (role === "ADMIN" && myRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only SUPER_ADMIN can create ADMIN" },
      { status: 403 }
    );
  }
  if (role === "USER" && myRole !== "ADMIN") {
    return NextResponse.json(
      { error: "Only ADMIN can create USER" },
      { status: 403 }
    );
  }

  // ── 6. Create user ─────────────────────────────────────────────────────────
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        userId,
        name,
        email:    email    ?? null,
        phone:    phone    ?? null,
        location: location ?? null,
        passwordHash,
        role: role as Role,
        // Force-link USER to the ADMIN who created them
        ...(role === "USER" && myRole === "ADMIN" ? { adminId: session.id } : {}),
      },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        location: true,
        adminId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, user: created }, { status: 201 });
  } catch (e: unknown) {
    const code = (e as { code?: string; meta?: { target?: unknown } } | null)?.code;
    if (code === "P2002") {
      const metaTarget = (e as { meta?: { target?: unknown } } | null)?.meta?.target;
      const fields = Array.isArray(metaTarget) ? metaTarget.join(", ") : "unique field";
      return NextResponse.json(
        { error: `Duplicate ${fields}` },
        { status: 409 }
      );
    }
    console.error("Create user error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}