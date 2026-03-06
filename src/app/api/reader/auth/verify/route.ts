import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLink } from "@/lib/reader/magic-link";
import {
  createReaderSession,
  setReaderSessionCookie,
} from "@/lib/reader/reader-session";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const email = await verifyMagicLink(token);
  if (!email) {
    return NextResponse.redirect(
      new URL("/library/login?error=invalid", request.url)
    );
  }

  const sessionToken = await createReaderSession(email);
  await setReaderSessionCookie(sessionToken);

  return NextResponse.redirect(new URL("/library", request.url));
}
