import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateFaqSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  isApproved: z.boolean().optional(),
  order: z.number().optional(),
});

// PATCH — edit/approve a FAQ
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, faqId } = await params;
  const author = await db.author.findUnique({
    where: { userId: session.user.id },
  });
  if (!author) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  // Verify ownership through the chain: author -> book -> section -> faq
  const faq = await db.sectionFAQ.findUnique({
    where: { id: faqId },
    include: { section: { include: { book: true } } },
  });

  if (!faq || faq.section.book.id !== id || faq.section.book.authorId !== author.id) {
    return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateFaqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const updated = await db.sectionFAQ.update({
    where: { id: faqId },
    data: parsed.data,
  });

  return NextResponse.json({ faq: updated });
}

// DELETE — remove a FAQ
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, faqId } = await params;
  const author = await db.author.findUnique({
    where: { userId: session.user.id },
  });
  if (!author) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  const faq = await db.sectionFAQ.findUnique({
    where: { id: faqId },
    include: { section: { include: { book: true } } },
  });

  if (!faq || faq.section.book.id !== id || faq.section.book.authorId !== author.id) {
    return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  }

  await db.sectionFAQ.delete({ where: { id: faqId } });

  return NextResponse.json({ deleted: true });
}
