import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateFormatSchema = z.object({
  price: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  trimSize: z.string().optional(),
  paperType: z.string().optional(),
  bindingType: z.string().optional(),
  interiorColor: z.string().optional(),
  printQuality: z.string().optional(),
  coverFinish: z.string().optional(),
  pageCount: z.number().int().optional(),
  interiorFileUrl: z.string().optional(),
  coverFileUrl: z.string().optional(),
  luluPodPackageId: z.string().optional(),
  printingCostCents: z.number().int().optional(),
  shippingEstimateCents: z.number().int().optional(),
  isbn: z.string().nullish(),
});

async function getAuthorFormat(bookId: string, formatId: string, userId: string) {
  const author = await db.author.findUnique({ where: { userId } });
  if (!author) return null;

  const book = await db.book.findFirst({
    where: { id: bookId, authorId: author.id },
  });
  if (!book) return null;

  return db.bookFormat.findFirst({
    where: { id: formatId, bookId },
  });
}

// PATCH — update format
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; formatId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, formatId } = await params;
  const format = await getAuthorFormat(id, formatId, session.user.id);
  if (!format) {
    return NextResponse.json({ error: "Format not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateFormatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const updated = await db.bookFormat.update({
    where: { id: formatId },
    data: parsed.data,
  });

  return NextResponse.json({ format: updated });
}

// DELETE — remove format
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; formatId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, formatId } = await params;
  const format = await getAuthorFormat(id, formatId, session.user.id);
  if (!format) {
    return NextResponse.json({ error: "Format not found" }, { status: 404 });
  }

  await db.bookFormat.delete({ where: { id: formatId } });

  return NextResponse.json({ success: true });
}
