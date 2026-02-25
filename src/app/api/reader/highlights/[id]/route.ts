import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { randomBytes } from "crypto";

const updateHighlightSchema = z.object({
  color: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// PATCH — update a highlight
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updateHighlightSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = { ...parsed.data };

  // Generate share token when making public for the first time
  if (parsed.data.isPublic) {
    const existing = await db.highlight.findUnique({ where: { id } });
    if (existing && !existing.shareToken) {
      data.shareToken = randomBytes(16).toString("hex");
    }
  }

  const highlight = await db.highlight.update({
    where: { id },
    data,
  });

  return NextResponse.json({ highlight });
}

// DELETE — remove a highlight
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await db.highlight.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
