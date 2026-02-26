import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Protect all dashboard routes
  if (
    pathname.startsWith("/titles") ||
    pathname.startsWith("/sales") ||
    pathname.startsWith("/settings")
  ) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname === "/login" || pathname === "/register") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/titles", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/titles/:path*",
    "/sales/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
