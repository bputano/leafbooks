import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// GET — list all FAQs for a book, grouped by section
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

  const sections = await db.bookSection.findMany({
    where: { bookId: book.id },
    orderBy: { order: "asc" },
    include: {
      faqs: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json({
    sections: sections.map((s) => ({
      id: s.id,
      heading: s.heading,
      slug: s.slug,
      order: s.order,
      faqs: s.faqs,
    })),
  });
}

const createFaqSchema = z.object({
  sectionId: z.string(),
  question: z.string().min(1),
  answer: z.string().min(1),
});

// POST — add a custom FAQ
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
  const parsed = createFaqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  // Verify the section belongs to this book
  const section = await db.bookSection.findFirst({
    where: { id: parsed.data.sectionId, bookId: book.id },
  });
  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const faq = await db.sectionFAQ.create({
    data: {
      sectionId: parsed.data.sectionId,
      question: parsed.data.question,
      answer: parsed.data.answer,
      isApproved: true,
      isCustom: true,
    },
  });

  return NextResponse.json({ faq });
}
