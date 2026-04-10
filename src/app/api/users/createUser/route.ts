import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/dbConnect";
import { getSession } from "@/lib/getSession";

export const runtime = "nodejs";

const CreateUserSchema = z.object({
  userId:   z.string().min(1,  "userId is required"),
  name:     z.string().min(1,  "name is required"),
  email:    z.string().email("valid email required"),
  phone:    z.string().optional(),
  location: z.string().optional(),
  password: z.string().min(6,  "password must be at least 6 chars"),
  // adminId and role are NOT accepted from the body — both enforced server-side
});

export async function POST(req: Request) {
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

    // Only ADMIN (and SUPER_ADMIN) may create users via this route.
    // SUPER_ADMIN is included so they can act on behalf of any admin.
    if (caller.role !== "ADMIN" && caller.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 3. Validate body ─────────────────────────────────────────────────────
    const body   = await req.json().catch(() => null);
    const parsed = CreateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, name, email, phone, location, password } = parsed.data;

    // ── 4. Create user ───────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        userId,
        name,
        email,
        phone:        phone    ?? null,
        location:     location ?? null,
        passwordHash,
        role:    "USER",      // always forced — never taken from body
        adminId: session.id,  // linked to the calling admin
      },
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
      },
    });

    return NextResponse.json({ ok: true, user: created }, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string; meta?: { target?: unknown } } | null)?.code;
    if (code === "P2002") {
      const metaTarget = (err as { meta?: { target?: unknown } } | null)?.meta?.target;
      const fields = Array.isArray(metaTarget) ? metaTarget.join(", ") : "unique field";
      return NextResponse.json(
        { error: `Duplicate ${fields}` },
        { status: 409 }
      );
    }
    console.error("Create user error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}