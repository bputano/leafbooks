import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { generatePresignedUploadUrl } from "@/lib/storage/presigned";
import {
  getManuscriptKey,
  getCoverKey,
  getPublicUrl,
  ALLOWED_MANUSCRIPT_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_MANUSCRIPT_SIZE,
  MAX_COVER_SIZE,
} from "@/lib/storage";

const presignedSchema = z.object({
  bookId: z.string(),
  fileType: z.enum(["manuscript", "cover"]),
  contentType: z.string(),
  filename: z.string(),
});

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

  const body = await req.json();
  const parsed = presignedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { bookId, fileType, contentType, filename } = parsed.data;

  // Verify book belongs to author
  const book = await db.book.findFirst({
    where: { id: bookId, authorId: author.id },
  });
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // Validate content type
  if (fileType === "manuscript" && !ALLOWED_MANUSCRIPT_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Invalid manuscript file type. Allowed: PDF, DOCX, EPUB" },
      { status: 400 }
    );
  }
  if (fileType === "cover" && !ALLOWED_IMAGE_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Invalid cover file type. Allowed: PNG, JPG, WEBP, PDF" },
      { status: 400 }
    );
  }

  const maxSize = fileType === "manuscript" ? MAX_MANUSCRIPT_SIZE : MAX_COVER_SIZE;
  const key =
    fileType === "manuscript"
      ? getManuscriptKey(author.id, bookId, filename)
      : getCoverKey(author.id, bookId, filename);

  const { url } = await generatePresignedUploadUrl({
    key,
    contentType,
    maxSize,
  });

  return NextResponse.json({ url, key, publicUrl: getPublicUrl(key) });
}
