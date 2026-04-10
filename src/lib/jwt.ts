// lib/jwt.ts
import { SignJWT, jwtVerify } from "jose";

const ACCESS_SECRET  = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET!);

// ── Sign ──────────────────────────────────────────────────────────────────────

export async function signAccessToken(payload: Record<string, unknown>) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(payload: Record<string, unknown>) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(REFRESH_SECRET);
}

// ── Verify ────────────────────────────────────────────────────────────────────

/** Verify an ACCESS token (short-lived, 15 m). Use on API routes. */
export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  return payload;
}

/** Verify a REFRESH token (long-lived, 7 d). Use in protected layout + middleware. */
export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload;
}

// ── Edge-safe decode (no verify) ─────────────────────────────────────────────
// Used in middleware.ts which runs on the Edge runtime.
// ⚠️  Does NOT verify signature — only use for routing decisions, never for auth.

export interface JwtBasicPayload {
  id?:     string;
  userId?: string;
  name?:   string;
  role?:   string;
  exp?:    number;
  iat?:    number;
}

export function decodeTokenUnsafe(token: string): JwtBasicPayload | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtBasicPayload;
  } catch {
    return null;
  }
}