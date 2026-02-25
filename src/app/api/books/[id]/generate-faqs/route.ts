import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateFaqsForBook } from "@/lib/reader/faq-generator";

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
    include: { sections: { select: { id: true } } },
  });
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (book.sections.length === 0) {
    return NextResponse.json(
      { error: "No sections found. Process content first." },
      { status: 400 }
    );
  }

  try {
    const count = await generateFaqsForBook(book.id);
    return NextResponse.json({ generated: count });
  } catch (error) {
    console.error("FAQ generation failed:", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
