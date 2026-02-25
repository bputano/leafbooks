import { NextRequest, NextResponse } from "next/server";
import { redeemGiftLink } from "@/lib/reader/access";
import { db } from "@/lib/db";
import { z } from "zod";

const redeemSchema = z.object({
  token: z.string(),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = redeemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const result = await redeemGiftLink(parsed.data.token, parsed.data.email);
  if (!result) {
    return NextResponse.json(
      { error: "This gift link is invalid or has already been claimed" },
      { status: 400 }
    );
  }

  // Get book info for redirect URL
  const book = await db.book.findUnique({
    where: { id: result.bookId },
    include: { author: true },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const readerUrl = `/${book.author.slug}/${book.slug}/read?token=${result.accessToken}`;

  return NextResponse.json({ readerUrl });
}
