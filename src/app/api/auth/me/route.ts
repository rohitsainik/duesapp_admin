// app/api/auth/me/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { errors } from "jose";

export const runtime = "nodejs";


export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = await verifyAccessToken(token);
    return NextResponse.json({
      id: payload.id,
      userId: payload.userId,
      name: payload.name,
      role: payload.role,
    });
  } catch (err) {
    // ✅ Client can call /api/auth/refresh on 401 + expired,
    // but should redirect to login on 401 + invalid
    if (err instanceof errors.JWTExpired) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}