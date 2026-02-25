import { randomBytes } from "crypto";
import { db } from "@/lib/db";

/**
 * Grant reader access to a book for a buyer.
 */
export async function grantAccess(
  bookId: string,
  buyerEmail: string,
  orderId?: string
): Promise<{ accessToken: string }> {
  const accessToken = randomBytes(32).toString("hex");

  const access = await db.readerAccess.upsert({
    where: {
      bookId_buyerEmail: { bookId, buyerEmail },
    },
    create: {
      bookId,
      buyerEmail,
      orderId: orderId || null,
      accessToken,
    },
    update: {
      // Don't overwrite existing access, but update orderId if missing
      orderId: orderId || undefined,
    },
  });

  return { accessToken: access.accessToken };
}

/**
 * Verify a reader access token is valid for a book.
 */
export async function verifyAccess(
  bookId: string,
  accessToken: string
): Promise<{ valid: boolean; buyerEmail?: string }> {
  const access = await db.readerAccess.findFirst({
    where: {
      bookId,
      accessToken,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!access) return { valid: false };
  return { valid: true, buyerEmail: access.buyerEmail };
}

/**
 * Check if an email already has access to a book.
 */
export async function getAccessForEmail(
  bookId: string,
  email: string
): Promise<{ hasAccess: boolean; accessToken?: string }> {
  const access = await db.readerAccess.findUnique({
    where: {
      bookId_buyerEmail: { bookId, buyerEmail: email },
    },
  });

  if (!access) return { hasAccess: false };
  return { hasAccess: true, accessToken: access.accessToken };
}

/**
 * Create a gift link for a book. Each buyer gets one gift per book.
 */
export async function createGiftLink(
  bookId: string,
  createdBy: string
): Promise<{ token: string }> {
  const token = randomBytes(16).toString("hex");

  const gift = await db.giftLink.create({
    data: {
      bookId,
      createdBy,
      token,
    },
  });

  return { token: gift.token };
}

/**
 * Redeem a gift link — creates ReaderAccess for the recipient.
 */
export async function redeemGiftLink(
  token: string,
  claimerEmail: string
): Promise<{ bookId: string; accessToken: string } | null> {
  const gift = await db.giftLink.findUnique({ where: { token } });
  if (!gift || gift.claimedBy) return null;

  // Mark the gift as claimed
  await db.giftLink.update({
    where: { id: gift.id },
    data: {
      claimedBy: claimerEmail,
      claimedAt: new Date(),
    },
  });

  // Grant access
  const { accessToken } = await grantAccess(gift.bookId, claimerEmail);

  // Mark the access as a gift
  await db.readerAccess.update({
    where: {
      bookId_buyerEmail: { bookId: gift.bookId, buyerEmail: claimerEmail },
    },
    data: {
      isGift: true,
      giftedBy: gift.createdBy,
    },
  });

  return { bookId: gift.bookId, accessToken };
}
