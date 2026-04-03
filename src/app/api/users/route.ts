// src/app/api/users/route.ts (POST)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/dbConnect";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: meId, role: myRoleRaw } = session.user as { id?: string; role?: "SUPER_ADMIN" | "ADMIN" | "USER" };
  const myRole: "SUPER_ADMIN" | "ADMIN" | "USER" = (myRoleRaw ?? "USER");

  try {
    const { userId, name, email, phone, password, role, location } = await req.json();

    if (!userId || !password || !role) {
      return NextResponse.json({ error: "userId, password, role are required" }, { status: 400 });
    }

    // RBAC
    if (role === "ADMIN" && myRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only SUPER_ADMIN can create ADMIN" }, { status: 403 });
    }
    if (role === "USER" && myRole !== "ADMIN") {
      return NextResponse.json({ error: "Only ADMIN can create USER" }, { status: 403 });
    }
    if (role === "SUPER_ADMIN" && myRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only SUPER_ADMIN can create SUPER_ADMIN" }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        userId,
        name: name ?? null,
        email: email ?? null,
        phone: phone ?? null,
        passwordHash,
        role,
        location: location ?? null,
        // Important: if an ADMIN is creating a USER, force-link to *this* admin
        ...(role === "USER" && myRole === "ADMIN" ? { adminId: meId } : {}),
      },
      select: { id: true, userId: true, name: true, email: true, phone: true, role: true, location: true, adminId: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json({ ok: true, user: created }, { status: 201 });
  } catch (e: unknown) {
    const code = (e as { code?: string; meta?: { target?: unknown } } | null)?.code;
    if (code === "P2002") {
      const metaTarget = (e as { meta?: { target?: unknown } } | null)?.meta?.target;
      const fields = Array.isArray(metaTarget) ? metaTarget.join(", ") : "unique field";
      return NextResponse.json({ error: `Unique constraint: ${fields}` }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}