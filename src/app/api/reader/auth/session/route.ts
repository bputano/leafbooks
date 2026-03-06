import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getReaderSession } from "@/lib/reader/reader-session";

export async function GET() {
  const email = await getReaderSession();

  if (!email) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true, email });
}

export async function PATCH(request: NextRequest) {
  const email = await getReaderSession();
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name } = await request.json();

  // Update name on all Reader records for this email
  await db.reader.updateMany({
    where: { email },
    data: { name: name || null },
  });

  return NextResponse.json({ success: true });
}
