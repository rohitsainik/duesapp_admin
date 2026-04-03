// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

const PUBLIC_PATHS = new Set(["/", "/login"]);
const PUBLIC_PREFIXES = ["/_next", "/favicon", "/assets", "/api/auth"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function roleHome(role?: string) {
  const R = (role ?? "").toString().toUpperCase();
  if (R === "SUPER_ADMIN") return "/super-admin";
  if (R === "ADMIN") return "/admin";
  return "/dashboard";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (req.method === "OPTIONS") return NextResponse.next();

  // Public paths
  if (isPublicPath(pathname)) {
    // If already logged in and goes to /login, send them to role home
    if (pathname === "/login") {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (token) {
        const dest = roleHome((token as JWT | { role?: string } | null)?.role as string | undefined);
        const url = req.nextUrl.clone();
        url.pathname = dest;
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  // Protected routes
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Normalize role
  const role = (((token as JWT | { role?: string } | null)?.role as string | undefined) ?? "")
    .toString()
    .toUpperCase();

  // Guard for /admin (only ADMIN or SUPER_ADMIN allowed)
  if (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = roleHome(role);
    return NextResponse.redirect(url);
  }

  // Guard for /super-admin (only SUPER_ADMIN allowed)
  if (pathname.startsWith("/super-admin") && role !== "SUPER_ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = roleHome(role);
    return NextResponse.redirect(url);
  }

  // Example: Guard for /users and /loans (only admin/super-admin can manage)
  if ((pathname.startsWith("/users") || pathname.startsWith("/loans")) &&
      role !== "ADMIN" && role !== "SUPER_ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = roleHome(role);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/loans/:path*",
    "/users/:path*",
    "/admin/:path*",
    "/super-admin/:path*",
    "/api/:path*",
  ],
};