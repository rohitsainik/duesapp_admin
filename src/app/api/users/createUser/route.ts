// app/api/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const CreateUserSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  name: z.string().min(1, "name is required"),
  email: z.string().email("valid email required"),
  phone: z.string().optional(),
  location: z.string().optional(),
  password: z.string().min(6, "password must be at least 6 chars"),
  // No adminId here. No role here. Both enforced server-side.
});

export async function POST(req: Request) {
  console.log("user creating.......");

  try {
    const session = await getServerSession(authOptions);
    console.log("this is the session", session);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Only the *request's* user (caller) matters
    const { id: callerId, role: rawRole } = session.user as { id?: string; role?: string };
    const callerRole = (rawRole ?? "").toString().toUpperCase();

    console.log("this is the callerId", callerId);

    // ✅ Strict: only ADMINs can create users (SUPER_ADMIN blocked by design)
    if (!callerId || callerRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    console.log("this is the body log", body);

    const parsed = CreateUserSchema.safeParse(body);
    console.log("parsed log", parsed);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, name, email, phone, location, password } = parsed.data;

    const passwordHash = await bcrypt.hash(password, 10);

    // ✅ adminId taken from *this* request's logged-in admin
    const created = await prisma.user.create({
      data: {
        userId,
        name,
        email,
        phone: phone ?? null,
        location: location ?? null,
        passwordHash,
        role: "USER", // force USER
        adminId: callerId, // link to the admin who is creating
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
    console.log("this is the created data", created);

    return NextResponse.json({ ok: true, user: created }, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string; meta?: { target?: string[] } } | null)?.code;
    if (code === "P2002") {
      const metaTarget = (err as { meta?: { target?: unknown } } | null)?.meta?.target;
      const fields = Array.isArray(metaTarget) ? metaTarget.join(", ") : "unique field";
      return NextResponse.json(
        { error: `Duplicate ${fields}` },
        { status: 409 }
      );
    }
    console.error("Create user error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
