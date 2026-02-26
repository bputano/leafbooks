import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { processManuscript } from "@/lib/reader/content-pipeline";
import { getPublicUrl } from "@/lib/storage";

// POST — publish/launch a book
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const author = await db.author.findUnique({
    where: { userId: session.user.id },
  });
  if (!author) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  const book = await db.book.findFirst({
    where: { id, authorId: author.id },
    include: { formats: true },
  });
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // Prevent re-publishing already-published books
  if (book.status === "PUBLISHED") {
    return NextResponse.json(
      { error: "Book is already published" },
      { status: 400 }
    );
  }

  // Validate book has at least one active format
  const activeFormats = book.formats.filter((f) => f.isActive);
  if (activeFormats.length === 0) {
    return NextResponse.json(
      { error: "At least one active format is required to publish" },
      { status: 400 }
    );
  }

  // Validate book has title
  if (!book.title || book.title === "Untitled") {
    return NextResponse.json(
      { error: "A title is required to publish" },
      { status: 400 }
    );
  }

  // Check if author has Stripe connected (required for paid sales)
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
  const hasStripeAccount = !!author.stripeAccountId;
  let stripeWarning: string | null = null;

  if (!hasStripeAccount) {
    if (stripeConfigured) {
      // Stripe is configured but author hasn't connected — block publishing
      return NextResponse.json(
        { error: "Please connect your Stripe account before publishing" },
        { status: 400 }
      );
    }
    // Stripe not configured (local dev / demo) — allow with warning
    stripeWarning =
      "Publishing without Stripe. Paid sales will not work until Stripe is connected.";
  }

  const updated = await db.book.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      wizardStep: 6,
    },
    include: { formats: true },
  });

  // Trigger content pipeline if manuscript is available and has Leaf Edition format
  const hasLeafEdition = updated.formats.some(
    (f) => f.type === "LEAF_EDITION" && f.isActive
  );
  if (
    (hasLeafEdition || updated.formats.some((f) => f.type === "EBOOK" && f.isActive)) &&
    book.manuscriptFileUrl &&
    book.manuscriptFileType
  ) {
    try {
      const fileUrl = book.manuscriptFileUrl.startsWith("http")
        ? book.manuscriptFileUrl
        : getPublicUrl(book.manuscriptFileUrl);
      // Run in background — don't block publish response
      processManuscript(
        book.id,
        fileUrl,
        book.manuscriptFileType,
        book.samplePercent
      ).catch((err) =>
        console.error("Content pipeline failed after publish:", err)
      );
    } catch (err) {
      console.error("Failed to start content pipeline:", err);
    }
  }

  return NextResponse.json({
    book: updated,
    url: `/${author.slug}/${updated.slug}`,
    ...(stripeWarning && { warning: stripeWarning }),
  });
}
