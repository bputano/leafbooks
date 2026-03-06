import { db } from "@/lib/db";
import type { ReaderSource, ReaderEventType, Prisma } from "@prisma/client";

/**
 * Upsert a reader record for an author. Creates if new, updates lastActiveAt if existing.
 * Returns the reader record.
 */
export async function upsertReader({
  authorId,
  email,
  name,
  source,
  sourceDetail,
}: {
  authorId: string;
  email: string;
  name?: string | null;
  source: ReaderSource;
  sourceDetail?: string | null;
}) {
  const reader = await db.reader.upsert({
    where: {
      authorId_email: { authorId, email },
    },
    create: {
      authorId,
      email,
      name: name || null,
      source,
      sourceDetail: sourceDetail || null,
      status: "SUBSCRIBER",
    },
    update: {
      lastActiveAt: new Date(),
      // Update name if we have a better one (non-null replacing null)
      ...(name ? { name } : {}),
    },
  });

  return reader;
}

/**
 * Record a reader event and update denormalized fields.
 */
export async function recordReaderEvent({
  readerId,
  type,
  bookId,
  metadata,
}: {
  readerId: string;
  type: ReaderEventType;
  bookId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  await db.readerEvent.create({
    data: {
      readerId,
      type,
      bookId: bookId || null,
      metadata: metadata || undefined,
    },
  });
}

/**
 * Handle a purchase: upsert reader, link to order, record event, update stats.
 */
export async function handleReaderPurchase({
  authorId,
  email,
  name,
  orderId,
  bookId,
  amount,
  formatType,
}: {
  authorId: string;
  email: string;
  name?: string | null;
  orderId: string;
  bookId: string;
  amount: number;
  formatType: string;
}) {
  const reader = await upsertReader({
    authorId,
    email,
    name,
    source: "PURCHASE",
  });

  // Upgrade status to CUSTOMER (don't downgrade VIP)
  if (reader.status === "SUBSCRIBER" || reader.status === "SAMPLE") {
    await db.reader.update({
      where: { id: reader.id },
      data: { status: "CUSTOMER" },
    });
  }

  // Update denormalized stats
  await db.reader.update({
    where: { id: reader.id },
    data: {
      totalSpent: { increment: amount },
      orderCount: { increment: 1 },
      lastActiveAt: new Date(),
    },
  });

  // Link order to reader
  await db.order.update({
    where: { id: orderId },
    data: { readerId: reader.id },
  });

  // Record event
  await recordReaderEvent({
    readerId: reader.id,
    type: "PURCHASED",
    bookId,
    metadata: { amount, formatType, orderId } as Prisma.InputJsonValue,
  });

  return reader;
}

/**
 * Handle email signup: upsert reader, record event.
 */
export async function handleReaderSubscribe({
  authorId,
  email,
  name,
  source,
  sourceDetail,
}: {
  authorId: string;
  email: string;
  name?: string | null;
  source?: string;
  sourceDetail?: string | null;
}) {
  const readerSource: ReaderSource =
    source === "purchase" ? "PURCHASE" : "EMAIL_SIGNUP";

  const reader = await upsertReader({
    authorId,
    email,
    name,
    source: readerSource,
    sourceDetail,
  });

  await recordReaderEvent({
    readerId: reader.id,
    type: "SUBSCRIBED",
    metadata: { source: source || "unknown", sourceDetail: sourceDetail || null } as Prisma.InputJsonValue,
  });

  return reader;
}

/**
 * Handle gift redemption: upsert reader, record event.
 */
export async function handleReaderGift({
  authorId,
  email,
  bookId,
  giftedBy,
}: {
  authorId: string;
  email: string;
  bookId: string;
  giftedBy: string;
}) {
  const reader = await upsertReader({
    authorId,
    email,
    source: "GIFT",
  });

  await recordReaderEvent({
    readerId: reader.id,
    type: "GIFT_RECEIVED",
    bookId,
    metadata: { giftedBy } as Prisma.InputJsonValue,
  });

  return reader;
}
