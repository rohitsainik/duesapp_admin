import { prisma } from "@/lib/dbConnect";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/jwt";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const roleMap: Record<string, string> = {
  SUPER_ADMIN: "superadmin",
  ADMIN: "admin",
  USER: "user",
};

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!refreshToken)
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });

  try {
    // ── 1. Verify signature + expiry ───────────────────────────────────────
    const payload = await verifyRefreshToken(refreshToken);

    // ── 2. Look up user ────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
    });

    // ── 3. Compare hash — detect token reuse / theft ───────────────────────
    const incomingHash = createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    if (!user || user.refreshToken !== incomingHash) {
      // Possible token reuse — wipe stored token to force re-login
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: null },
        });
      }
      return NextResponse.json({ error: "Token reuse detected" }, { status: 403 });
    }

    // ── 4. Build new token payload ─────────────────────────────────────────
    const newPayload = {
      id: user.id,
      userId: user.userId,
      name: user.name,
      role: roleMap[user.role.toUpperCase()] ?? "user",
    };

    // ── 5. Rotate tokens ───────────────────────────────────────────────────
    const newAccessToken  = await signAccessToken(newPayload);
    const newRefreshToken = await signRefreshToken({ id: user.id });

    // ── 6. Store hash of new refresh token ─────────────────────────────────
    const newRefreshTokenHash = createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshTokenHash },
    });

    // ── 7. Set cookies ─────────────────────────────────────────────────────
    const res = NextResponse.json({ ok: true });

    res.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15, // 15 min
    });

    res.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 403 });
  }
}