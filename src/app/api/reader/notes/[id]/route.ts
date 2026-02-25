import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { randomBytes } from "crypto";

const updateNoteSchema = z.object({
  content: z.string().min(1).optional(),
  isPublic: z.boolean().optional(),
});

// PATCH — update a note
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = { ...parsed.data };

  // Generate share token when making public
  if (parsed.data.isPublic) {
    const existing = await db.note.findUnique({ where: { id } });
    if (existing && !existing.shareToken) {
      data.shareToken = randomBytes(16).toString("hex");
    }
  }

  const note = await db.note.update({
    where: { id },
    data,
  });

  return NextResponse.json({ note });
}

// DELETE — remove a note
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await db.note.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
