import { NextRequest, NextResponse } from "next/server";
import { createReaderSession, setReaderSessionCookie } from "@/lib/reader/reader-session";

/**
 * Dev-only route to create a session for testing.
 * GET /api/reader/auth/dev-login?email=james.patel@fastmail.com
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email param required" }, { status: 400 });
  }

  const token = await createReaderSession(email);
  await setReaderSessionCookie(token);

  return NextResponse.redirect(new URL("/library", request.url));
}
