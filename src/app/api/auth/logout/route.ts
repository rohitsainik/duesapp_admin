import { prisma } from "@/lib/dbConnect";
import { verifyRefreshToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;

  // Invalidate server-side even if cookie is tampered / expired —
  // best-effort, so errors are intentionally swallowed.
  if (refreshToken) {
    try {
      const payload = await verifyRefreshToken(refreshToken);
      await prisma.user.update({
        where: { id: payload.id as string },
        data: { refreshToken: null },
      });
    } catch {
      // Token invalid or expired — nothing to invalidate, continue logout
    }
  }

  const res = NextResponse.json({ ok: true });

  // ✅ Clear both cookies
  res.cookies.delete("access_token");
  res.cookies.delete("refresh_token");

  return res;
}