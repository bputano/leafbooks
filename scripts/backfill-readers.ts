/**
 * Backfill Reader records from existing Orders and EmailSubscribers.
 *
 * Run after applying the Prisma migration:
 *   npx prisma db push
 *   npx tsx scripts/backfill-readers.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Backfilling Reader records...\n");

  // Get all authors
  const authors = await db.author.findMany({ select: { id: true, displayName: true } });

  for (const author of authors) {
    console.log(`Processing author: ${author.displayName} (${author.id})`);

    // Gather all unique emails from orders + email subscribers
    const [orders, subscribers] = await Promise.all([
      db.order.findMany({
        where: {
          book: { authorId: author.id },
          status: { in: ["PAID", "FULFILLED"] },
        },
        include: {
          book: { select: { id: true, title: true } },
          bookFormat: { select: { type: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      db.emailSubscriber.findMany({
        where: { authorId: author.id },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Build a map of email -> reader data
    const readerMap = new Map<string, {
      email: string;
      name: string | null;
      source: "PURCHASE" | "EMAIL_SIGNUP";
      status: "SUBSCRIBER" | "CUSTOMER";
      totalSpent: number;
      orderCount: number;
      firstSeenAt: Date;
      lastActiveAt: Date;
      orderIds: string[];
    }>();

    // First pass: email subscribers
    for (const sub of subscribers) {
      readerMap.set(sub.email, {
        email: sub.email,
        name: sub.name,
        source: sub.source === "purchase" ? "PURCHASE" : "EMAIL_SIGNUP",
        status: "SUBSCRIBER",
        totalSpent: 0,
        orderCount: 0,
        firstSeenAt: sub.createdAt,
        lastActiveAt: sub.createdAt,
        orderIds: [],
      });
    }

    // Second pass: orders (upgrade status, accumulate stats)
    for (const order of orders) {
      const existing = readerMap.get(order.buyerEmail);
      if (existing) {
        existing.source = "PURCHASE";
        existing.status = "CUSTOMER";
        existing.totalSpent += order.amount;
        existing.orderCount += 1;
        existing.lastActiveAt = order.createdAt;
        existing.orderIds.push(order.id);
        if (!existing.name && order.buyerName) {
          existing.name = order.buyerName;
        }
      } else {
        readerMap.set(order.buyerEmail, {
          email: order.buyerEmail,
          name: order.buyerName,
          source: "PURCHASE",
          status: "CUSTOMER",
          totalSpent: order.amount,
          orderCount: 1,
          firstSeenAt: order.createdAt,
          lastActiveAt: order.createdAt,
          orderIds: [order.id],
        });
      }
    }

    // Create Reader records
    let created = 0;
    for (const [, data] of readerMap) {
      const reader = await db.reader.upsert({
        where: {
          authorId_email: { authorId: author.id, email: data.email },
        },
        create: {
          authorId: author.id,
          email: data.email,
          name: data.name,
          source: data.source,
          status: data.status,
          totalSpent: data.totalSpent,
          orderCount: data.orderCount,
          firstSeenAt: data.firstSeenAt,
          lastActiveAt: data.lastActiveAt,
        },
        update: {}, // Don't overwrite if already exists
      });

      // Link orders to reader
      if (data.orderIds.length > 0) {
        await db.order.updateMany({
          where: { id: { in: data.orderIds } },
          data: { readerId: reader.id },
        });
      }

      // Create events
      // Subscribed event
      await db.readerEvent.create({
        data: {
          readerId: reader.id,
          type: "SUBSCRIBED",
          metadata: { source: data.source === "PURCHASE" ? "purchase" : "backfill" },
          createdAt: data.firstSeenAt,
        },
      });

      // Purchase events
      for (const orderId of data.orderIds) {
        const order = orders.find((o) => o.id === orderId)!;
        await db.readerEvent.create({
          data: {
            readerId: reader.id,
            type: "PURCHASED",
            bookId: order.bookId,
            metadata: {
              amount: order.amount,
              formatType: order.bookFormat?.type || order.format,
              orderId: order.id,
            },
            createdAt: order.createdAt,
          },
        });
      }

      created++;
    }

    console.log(`  Created ${created} readers (${orders.length} orders, ${subscribers.length} subscribers)\n`);
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
