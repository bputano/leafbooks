import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  // Protect all dashboard routes
  if (
    pathname.startsWith("/titles") ||
    pathname.startsWith("/sales") ||
    pathname.startsWith("/settings")
  ) {
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      return NextResponse.redirect(new URL("/titles", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/titles/:path*",
    "/sales/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
