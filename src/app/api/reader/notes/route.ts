import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createNoteSchema = z.object({
  sectionId: z.string(),
  bookId: z.string(),
  buyerEmail: z.string().email(),
  highlightId: z.string().optional(),
  content: z.string().min(1),
});

// POST — create a note
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const note = await db.note.create({
    data: {
      sectionId: parsed.data.sectionId,
      bookId: parsed.data.bookId,
      buyerEmail: parsed.data.buyerEmail,
      highlightId: parsed.data.highlightId || null,
      content: parsed.data.content,
    },
  });

  return NextResponse.json({ note });
}

// GET — list notes for a section
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get("sectionId");
  const buyerEmail = searchParams.get("buyerEmail");

  if (!sectionId || !buyerEmail) {
    return NextResponse.json(
      { error: "sectionId and buyerEmail required" },
      { status: 400 }
    );
  }

  const notes = await db.note.findMany({
    where: { sectionId, buyerEmail },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notes });
}
