import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createFormatSchema = z.object({
  type: z.enum(["HARDCOVER", "PAPERBACK", "EBOOK", "LEAF_EDITION"]),
  price: z.number().int().min(0),
  trimSize: z.string().optional(),
  paperType: z.string().optional(),
  bindingType: z.string().optional(),
  interiorColor: z.string().optional(),
  printQuality: z.string().optional(),
  coverFinish: z.string().optional(),
  pageCount: z.number().int().optional(),
});

// GET — list formats for a book
export async function GET(
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

  const formats = await db.bookFormat.findMany({
    where: { bookId: id },
  });

  return NextResponse.json({ formats });
}

// POST — add a format
export async function POST(
  req: NextRequest,
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

  const body = await req.json();
  const parsed = createFormatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  // Check for duplicate format type
  const existing = await db.bookFormat.findFirst({
    where: { bookId: id, type: parsed.data.type },
  });
  if (existing) {
    return NextResponse.json(
      { error: `${parsed.data.type} format already exists` },
      { status: 409 }
    );
  }

  const format = await db.bookFormat.create({
    data: {
      bookId: id,
      ...parsed.data,
    },
  });

  return NextResponse.json({ format }, { status: 201 });
}
