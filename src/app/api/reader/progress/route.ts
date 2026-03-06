import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getReaderSession } from "@/lib/reader/reader-session";

export async function POST(request: NextRequest) {
  const email = await getReaderSession();
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { bookId, sectionId } = await request.json();
  if (!bookId || !sectionId) {
    return NextResponse.json(
      { error: "bookId and sectionId required" },
      { status: 400 }
    );
  }

  await db.readingProgress.upsert({
    where: { readerEmail_bookId: { readerEmail: email, bookId } },
    create: {
      readerEmail: email,
      bookId,
      lastSectionId: sectionId,
      lastReadAt: new Date(),
    },
    update: {
      lastSectionId: sectionId,
      lastReadAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const email = await getReaderSession();
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const bookId = request.nextUrl.searchParams.get("bookId");

  if (bookId) {
    const progress = await db.readingProgress.findUnique({
      where: { readerEmail_bookId: { readerEmail: email, bookId } },
    });
    return NextResponse.json({ progress });
  }

  const progress = await db.readingProgress.findMany({
    where: { readerEmail: email },
  });
  return NextResponse.json({ progress });
}
