import { NextRequest, NextResponse } from "next/server";
import { createMagicLink } from "@/lib/reader/magic-link";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = body.email?.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Valid email required" },
      { status: 400 }
    );
  }

  const { url } = await createMagicLink(email);

  // Dev mode: return the URL directly so it can be shown to the user
  return NextResponse.json({ url });
}
