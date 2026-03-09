import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const DEMO_USER_ID = process.env.DEMO_USER_ID ?? "";

function getTokenFromRequest(req: NextRequest) {
  return getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName:
      req.nextUrl.protocol === "https:"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getTokenFromRequest(req);

  // Protect all dashboard routes — redirect to login if not authenticated
  const isDashboardRoute =
    pathname.startsWith("/titles") ||
    pathname.startsWith("/sales") ||
    pathname.startsWith("/readers") ||
    pathname.startsWith("/bonus-library") ||
    pathname.startsWith("/grow") ||
    pathname.startsWith("/settings");

  if (isDashboardRoute && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from auth pages
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      return NextResponse.redirect(new URL("/readers", req.url));
    }
  }

  // Demo mode: block all write operations on API routes (except auth)
  if (
    DEMO_USER_ID &&
    token?.id === DEMO_USER_ID &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
  ) {
    // Allow auth routes (sign-in/sign-out must work)
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    // Block API writes
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "This is a demo account. Sign up for Canopy to start building!" },
        { status: 403 }
      );
    }

    // Block server action POSTs on dashboard pages
    if (isDashboardRoute && req.method === "POST") {
      return NextResponse.json(
        { error: "This is a demo account. Sign up for Canopy to start building!" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/titles/:path*",
    "/sales/:path*",
    "/readers/:path*",
    "/bonus-library/:path*",
    "/grow/:path*",
    "/settings/:path*",
    "/login",
    "/register",
    "/api/:path*",
  ],
};
