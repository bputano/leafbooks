import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { randomBytes } from "crypto";

async function getAuthorFromSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.author.findUnique({ where: { userId: session.user.id } });
}

// Author dashboard: get referral stats
export async function GET(request: NextRequest) {
  const author = await getAuthorFromSession();
  if (!author) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const referrals = await db.referral.findMany({
    where: { authorId: author.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      book: { select: { title: true } },
    },
  });

  const totalReferrals = await db.referral.count({
    where: { authorId: author.id },
  });
  const totalClicks = await db.referral.aggregate({
    where: { authorId: author.id },
    _sum: { clickCount: true },
  });
  const totalConverted = await db.referral.count({
    where: { authorId: author.id, status: "CONVERTED" },
  });

  return NextResponse.json({
    referrals,
    stats: {
      totalReferrals,
      totalClicks: totalClicks._sum.clickCount || 0,
      totalConverted,
    },
  });
}

// Generate or retrieve a referral code for a reader+book
const generateSchema = z.object({
  bookId: z.string(),
  referrerEmail: z.string().email(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { bookId, referrerEmail } = parsed.data;

  // Look up the book to get the author
  const book = await db.book.findUnique({
    where: { id: bookId },
    include: { author: true },
  });
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (!book.author.referralEnabled) {
    return NextResponse.json(
      { error: "Referral program not enabled" },
      { status: 400 }
    );
  }

  // Check for existing referral code for this reader+book
  const existing = await db.referral.findFirst({
    where: {
      bookId,
      referrerEmail,
      source: "LINK",
    },
  });

  if (existing) {
    return NextResponse.json({ referral: existing });
  }

  // Generate a new code
  const referralCode = randomBytes(6).toString("hex");

  const referral = await db.referral.create({
    data: {
      authorId: book.authorId,
      bookId,
      referrerEmail,
      referralCode,
      source: "LINK",
    },
  });

  return NextResponse.json({ referral }, { status: 201 });
}
