import { NextResponse } from "next/server";
import { clearReaderSession } from "@/lib/reader/reader-session";

export async function POST() {
  await clearReaderSession();
  return NextResponse.json({ success: true });
}
