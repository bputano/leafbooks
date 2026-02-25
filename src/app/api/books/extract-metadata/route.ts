import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractMetadataFromManuscript } from "@/lib/ai/extract-metadata";
import { getPublicUrl } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const author = await db.author.findUnique({
    where: { userId: session.user.id },
  });
  if (!author) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { bookId } = body;
  if (!bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  const book = await db.book.findFirst({
    where: { id: bookId, authorId: author.id },
  });
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (!book.manuscriptFileUrl) {
    return NextResponse.json(
      { error: "No manuscript uploaded" },
      { status: 400 }
    );
  }

  const fileUrl = getPublicUrl(book.manuscriptFileUrl);
  const metadata = await extractMetadataFromManuscript(
    fileUrl,
    book.manuscriptFileType || "pdf"
  );

  // Update book with extracted metadata
  const updateData: Record<string, unknown> = {};
  if (metadata.title) updateData.title = metadata.title;
  if (metadata.subtitle) updateData.subtitle = metadata.subtitle;
  if (metadata.description) updateData.description = metadata.description;
  if (metadata.keywords) updateData.keywords = metadata.keywords;
  if (metadata.bisacCodes) updateData.bisacCodes = metadata.bisacCodes;
  if (metadata.isbn) updateData.isbn = metadata.isbn;

  // Generate a slug from the extracted title if the current slug is auto-generated
  if (metadata.title && book.slug.startsWith("untitled-")) {
    const baseSlug = metadata.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    let slug = baseSlug || "book";
    let counter = 1;
    // Check uniqueness for this author
    while (
      await db.book.findFirst({
        where: { authorId: author.id, slug, id: { not: bookId } },
      })
    ) {
      slug = `${baseSlug}-${counter++}`;
    }
    updateData.slug = slug;
  }

  if (Object.keys(updateData).length > 0) {
    await db.book.update({
      where: { id: bookId },
      data: updateData,
    });
  }

  return NextResponse.json({ metadata });
}
