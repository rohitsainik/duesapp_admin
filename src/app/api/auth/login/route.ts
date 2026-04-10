import { prisma } from "@/lib/dbConnect";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// A valid bcrypt hash of a dummy password — used to waste time when user
// is not found, so response time is constant regardless of whether userId exists.
const DUMMY_HASH =
  "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012344";

const roleMap: Record<string, string> = {
  SUPER_ADMIN: "superadmin",
  ADMIN: "admin",
  USER: "user",
};

export async function POST(req: NextRequest) {
  // ── 1. Parse & validate input ──────────────────────────────────────────────
  const body = await req.json().catch(() => null);

  if (!body?.userId || !body?.password) {
    return NextResponse.json(
      { error: "userId and password are required" },
      { status: 400 }
    );
  }

  const { userId, password } = body as { userId: string; password: string };

  // ── 2. Look up user ────────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({ where: { userId } });

  // ── 3. Always run bcrypt — constant response time ──────────────────────────
  const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
  const ok = await bcrypt.compare(password, hashToCompare);

  if (!user || !user.passwordHash || !ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // ── 4. Build token payload ─────────────────────────────────────────────────
  const payload = {
    id: user.id,
    userId: user.userId,
    name: user.name,
    role: roleMap[user.role.toUpperCase()] ?? "user",
  };

  // ── 5. Sign tokens ─────────────────────────────────────────────────────────
  const accessToken  = await signAccessToken(payload);
  const refreshToken = await signRefreshToken({ id: user.id });

  // ── 6. Hash refresh token before storing ──────────────────────────────────
  const refreshTokenHash = createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: refreshTokenHash },
  });

  // ── 7. Set cookies — no tokens in response body ────────────────────────────
  const res = NextResponse.json({ user: payload });

  res.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 15, // 15 min
  });

  res.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}