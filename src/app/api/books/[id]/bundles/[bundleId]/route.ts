import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

async function getAuthorFromSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.author.findUnique({ where: { userId: session.user.id } });
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  items: z
    .array(
      z.object({
        bookFormatId: z.string().optional(),
        bonusMaterialId: z.string().optional(),
      })
    )
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bundleId: string }> }
) {
  const author = await getAuthorFromSession();
  if (!author) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bookId, bundleId } = await params;

  const book = await db.book.findFirst({
    where: { id: bookId, authorId: author.id },
  });
  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await db.bundle.findFirst({
    where: { id: bundleId, bookId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { items, ...data } = parsed.data;

  // If items are provided, replace all items
  if (items) {
    await db.bundleItem.deleteMany({ where: { bundleId } });
    await db.bundleItem.createMany({
      data: items
        .filter((i) => i.bookFormatId || i.bonusMaterialId)
        .map((i) => ({
          bundleId,
          bookFormatId: i.bookFormatId || null,
          bonusMaterialId: i.bonusMaterialId || null,
        })),
    });
  }

  const bundle = await db.bundle.update({
    where: { id: bundleId },
    data,
    include: {
      items: {
        include: {
          bookFormat: true,
          bonusMaterial: true,
        },
      },
    },
  });

  return NextResponse.json({ bundle });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; bundleId: string }> }
) {
  const author = await getAuthorFromSession();
  if (!author) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bookId, bundleId } = await params;

  const book = await db.book.findFirst({
    where: { id: bookId, authorId: author.id },
  });
  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await db.bundle.findFirst({
    where: { id: bundleId, bookId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }

  await db.bundle.delete({ where: { id: bundleId } });

  return NextResponse.json({ success: true });
}
