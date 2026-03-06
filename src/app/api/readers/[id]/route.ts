import { NextRequest, NextResponse } from "next/server";
import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";
import { z } from "zod";

// GET /api/readers/[id] — get reader detail with events and orders
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const author = await getAuthor();
  const { id } = await params;

  const reader = await db.reader.findFirst({
    where: { id, authorId: author.id },
    include: {
      orders: {
        where: { status: { in: ["PAID", "FULFILLED"] } },
        include: {
          book: { select: { title: true, coverImageUrl: true } },
          bookFormat: { select: { type: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          book: { select: { title: true } },
        },
      },
    },
  });

  if (!reader) {
    return NextResponse.json({ error: "Reader not found" }, { status: 404 });
  }

  return NextResponse.json({ reader });
}

// PATCH /api/readers/[id] — update reader (notes, tags, status, name)
const updateSchema = z.object({
  name: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["SUBSCRIBER", "SAMPLE", "CUSTOMER", "VIP", "CHURNED"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const author = await getAuthor();
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  // Verify ownership
  const existing = await db.reader.findFirst({
    where: { id, authorId: author.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Reader not found" }, { status: 404 });
  }

  const reader = await db.reader.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ reader });
}
