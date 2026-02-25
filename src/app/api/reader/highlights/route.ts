import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { randomBytes } from "crypto";

const createHighlightSchema = z.object({
  sectionId: z.string(),
  bookId: z.string(),
  buyerEmail: z.string().email(),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(1),
  selectedText: z.string().min(1),
  color: z.string().default("yellow"),
});

// POST — create a highlight
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createHighlightSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const highlight = await db.highlight.create({
    data: parsed.data,
  });

  return NextResponse.json({ highlight });
}

// GET — list highlights for a section
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

  const highlights = await db.highlight.findMany({
    where: { sectionId, buyerEmail },
    orderBy: { startOffset: "asc" },
  });

  return NextResponse.json({ highlights });
}
