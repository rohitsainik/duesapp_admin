// middleware.ts  —  place at project root (next to package.json)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ── Secrets ───────────────────────────────────────────────────────────────────
// refresh_token is signed with REFRESH_TOKEN_SECRET (7 d).
// access_token  is signed with ACCESS_TOKEN_SECRET  (15 m) — used by API routes only.
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.REFRESH_TOKEN_SECRET!
);

// ── Role → home route ─────────────────────────────────────────────────────────
function roleHome(role?: string): string {
  const r = (role ?? "").toLowerCase();
  if (r === "superadmin") return "/superadmin";
  if (r === "admin")      return "/admin";
  return "/auth/login"; // no "user" role in the app yet
}

// ── Decode refresh token (Edge-safe, no Node crypto) ─────────────────────────
// We use jwtVerify here — jose works in the Edge runtime.
async function getPayload(req: NextRequest) {
  // Only read from the refresh_token cookie (set by your /api/auth/login route)
  const token = req.cookies.get("refresh_token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload;
  } catch {
    return null; // expired or tampered
  }
}

// ── Paths that never need a token ─────────────────────────────────────────────
const AUTH_PREFIXES = ["/_next", "/favicon", "/assets"];

function isStaticAsset(pathname: string) {
  return AUTH_PREFIXES.some((p) => pathname.startsWith(p));
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always skip static assets & Next.js internals
  if (isStaticAsset(pathname)) return NextResponse.next();

  // Let OPTIONS through (CORS pre-flight)
  if (req.method === "OPTIONS") return NextResponse.next();

  // Let API auth routes handle themselves (login, logout, refresh, me)
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // ── Resolve who is making the request ──────────────────────────────────────
  const payload = await getPayload(req);
  const role    = ((payload?.role as string) ?? "").toLowerCase(); // "admin" | "superadmin" | ""
  const isLoggedIn = !!payload && ["admin", "superadmin"].includes(role);

  // ── /auth/login ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/auth/login")) {
    if (isLoggedIn) {
      // Already authenticated → send to their home, don't show login again
      return NextResponse.redirect(new URL(roleHome(role), req.url));
    }
    return NextResponse.next();
  }

  // ── "/" root ───────────────────────────────────────────────────────────────
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isLoggedIn ? roleHome(role) : "/auth/login", req.url)
    );
  }

  // ── All other protected routes — must be logged in ─────────────────────────
  if (!isLoggedIn) {
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("next", pathname); // preserve intended destination
    return NextResponse.redirect(url);
  }

  // ── Route-level role guards ────────────────────────────────────────────────

  // /superadmin/** — superadmin only
  if (pathname.startsWith("/superadmin") && role !== "superadmin") {
    return NextResponse.redirect(new URL(roleHome(role), req.url));
  }

  // /admin/** — admin only (superadmin has its own separate section)
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(roleHome(role), req.url));
  }

  // All checks passed
  return NextResponse.next();
}

// ── Matcher ───────────────────────────────────────────────────────────────────
// Runs on every route except static files and Next.js internals.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};