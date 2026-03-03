import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPublicUrl } from "@/lib/storage";

export const maxDuration = 60; // Vercel Hobby plan limit

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const author = await db.author.findUnique({
    where: { userId: session.user.id },
  });
  if (!author) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  const book = await db.book.findFirst({
    where: { id, authorId: author.id },
  });
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (!book.manuscriptFileUrl || !book.manuscriptFileType) {
    return NextResponse.json(
      { error: "No manuscript uploaded" },
      { status: 400 }
    );
  }

  const fileUrl = book.manuscriptFileUrl.startsWith("http")
    ? book.manuscriptFileUrl
    : getPublicUrl(book.manuscriptFileUrl);

  try {
    const { processManuscript } = await import("@/lib/reader/content-pipeline");
    await processManuscript(
      book.id,
      fileUrl,
      book.manuscriptFileType,
      book.samplePercent
    );

    const sections = await db.bookSection.findMany({
      where: { bookId: book.id },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, heading: true, wordCount: true, isFree: true },
    });

    const hasGemini = !!process.env.GEMINI_API_KEY;

    return NextResponse.json({
      sections,
      debug: {
        sectionCount: sections.length,
        geminiEnabled: hasGemini,
        fileType: book.manuscriptFileType,
      },
    });
  } catch (error) {
    console.error("Content processing failed:", error);
    const message = error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
