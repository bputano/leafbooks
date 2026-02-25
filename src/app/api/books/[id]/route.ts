import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().nullish(),
  description: z.string().nullish(),
  slug: z.string().optional(),
  isbn: z.string().nullish(),
  keywords: z.array(z.string()).optional(),
  bisacCodes: z.array(z.string()).optional(),
  wizardStep: z.number().optional(),
  manuscriptFileUrl: z.string().nullish(),
  manuscriptFileType: z.string().nullish(),
  coverFileUrl: z.string().nullish(),
  coverImageUrl: z.string().nullish(),
  launchDate: z.string().nullish(),
  preOrderDate: z.string().nullish(),
  isPreOrder: z.boolean().optional(),
});

async function getAuthorBook(bookId: string, userId: string) {
  const author = await db.author.findUnique({
    where: { userId },
  });
  if (!author) return null;

  const book = await db.book.findFirst({
    where: { id: bookId, authorId: author.id },
    include: { formats: true },
  });
  return book;
}

// GET — get a single book
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const book = await getAuthorBook(id, session.user.id);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  return NextResponse.json({ book });
}

// PATCH — update book
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const book = await getAuthorBook(id, session.user.id);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (data.launchDate) {
    data.launchDate = new Date(data.launchDate as string);
  }
  if (data.preOrderDate) {
    data.preOrderDate = new Date(data.preOrderDate as string);
  }
  // Auto-set isPreOrder based on preOrderDate
  if ("preOrderDate" in data) {
    data.isPreOrder = !!data.preOrderDate;
  }

  const updated = await db.book.update({
    where: { id },
    data,
    include: { formats: true },
  });

  return NextResponse.json({ book: updated });
}

// DELETE — delete book
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const book = await getAuthorBook(id, session.user.id);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  await db.book.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
