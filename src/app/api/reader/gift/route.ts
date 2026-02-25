import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createGiftLink } from "@/lib/reader/access";
import { z } from "zod";

const createGiftSchema = z.object({
  bookId: z.string(),
  buyerEmail: z.string().email(),
});

// POST — create a gift link
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createGiftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { bookId, buyerEmail } = parsed.data;

  // Verify buyer has access to this book
  const access = await db.readerAccess.findUnique({
    where: { bookId_buyerEmail: { bookId, buyerEmail } },
  });
  if (!access) {
    return NextResponse.json(
      { error: "You don't have access to this book" },
      { status: 403 }
    );
  }

  // Check if buyer already created a gift for this book
  const existingGift = await db.giftLink.findUnique({
    where: { bookId_createdBy: { bookId, createdBy: buyerEmail } },
  });
  if (existingGift) {
    return NextResponse.json({ token: existingGift.token });
  }

  try {
    const { token } = await createGiftLink(bookId, buyerEmail);
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create gift link" },
      { status: 500 }
    );
  }
}
