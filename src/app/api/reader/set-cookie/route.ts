import { NextRequest, NextResponse } from "next/server";
import { verifyAccess } from "@/lib/reader/access";

/**
 * Sets the reader access cookie and redirects to the target URL.
 * Called when a reader accesses a section with a ?token= parameter.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const bookId = request.nextUrl.searchParams.get("bookId");
  const redirect = request.nextUrl.searchParams.get("redirect");

  if (!token || !bookId || !redirect) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const result = await verifyAccess(bookId, token);
  if (!result.valid) {
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  const response = NextResponse.redirect(new URL(redirect, request.url));
  response.cookies.set(`leaf_reader_${bookId}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return response;
}
