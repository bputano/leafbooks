/**
 * Seed 50 sample readers with orders, events, and email subscribers.
 * Run: npx tsx scripts/seed-readers.ts
 */

import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const db = new PrismaClient();

const FIRST_NAMES = [
  "Sarah", "James", "Emily", "Michael", "Jessica", "David", "Amanda", "Chris",
  "Rachel", "Matt", "Lauren", "Ryan", "Megan", "Tom", "Katie", "Brian",
  "Olivia", "Dan", "Hannah", "Alex", "Sophia", "Kevin", "Emma", "Jake",
  "Ashley", "Nick", "Natalie", "Tyler", "Samantha", "Andrew", "Julia", "Mark",
  "Chloe", "Eric", "Allison", "Josh", "Lily", "Adam", "Grace", "Brandon",
  "Morgan", "Derek", "Kayla", "Sean", "Taylor", "Greg", "Brooke", "Scott",
  "Zoe", "Patrick",
];

const LAST_NAMES = [
  "Chen", "Patel", "Johnson", "Williams", "Garcia", "Kim", "Martinez", "Lee",
  "Brown", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Clark",
  "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Hill",
  "Scott", "Green", "Adams", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts", "Turner", "Phillips", "Parker", "Evans", "Edwards", "Collins",
  "Stewart", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Cooper", "Peterson",
  "Bailey", "Murphy",
];

const DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hey.com", "proton.me",
  "icloud.com", "fastmail.com", "hotmail.com",
];

const SOURCES: string[] = ["PURCHASE", "EMAIL_SIGNUP", "EMAIL_SIGNUP", "GIFT", "EMAIL_SIGNUP"];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const author = await db.author.findFirst({
    where: { books: { some: { formats: { some: {} } } } },
    include: { books: { include: { formats: true } } },
  });

  if (!author || author.books.length === 0) {
    console.error("No author or books found. Create a book with at least one format first.");
    process.exit(1);
  }

  // Pick the book that has formats
  const book = author.books.find(b => b.formats.length > 0) || author.books[0];
  const formats = book.formats;

  console.log(`Seeding readers for "${book.title}" by ${author.displayName}\n`);

  const startDate = new Date("2026-01-15");
  const endDate = new Date("2026-03-06");

  let customersCreated = 0;
  let subscribersCreated = 0;

  for (let i = 0; i < 50; i++) {
    const firstName = FIRST_NAMES[i];
    const lastName = LAST_NAMES[i];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${pick(DOMAINS)}`;
    const source = pick(SOURCES);
    const firstSeen = randomDate(startDate, endDate);

    // ~60% are customers (purchased), ~30% subscribers, ~10% gift recipients
    const isPurchaser = source === "PURCHASE" || Math.random() < 0.5;
    const isGift = source === "GIFT" as string && !isPurchaser;

    const reader = await db.reader.create({
      data: {
        authorId: author.id,
        email,
        name,
        source: isPurchaser ? "PURCHASE" : source as "PURCHASE" | "EMAIL_SIGNUP" | "GIFT" | "REFERRAL" | "MANUAL" | "SAMPLE_REQUEST",
        status: isPurchaser ? "CUSTOMER" : isGift ? "SUBSCRIBER" : "SUBSCRIBER",
        totalSpent: 0,
        orderCount: 0,
        firstSeenAt: firstSeen,
        lastActiveAt: firstSeen,
      },
    });

    // Create subscribed event
    await db.readerEvent.create({
      data: {
        readerId: reader.id,
        type: "SUBSCRIBED",
        metadata: { source: isPurchaser ? "purchase" : source.toLowerCase() },
        createdAt: firstSeen,
      },
    });

    // Also add to EmailSubscriber for consistency
    await db.emailSubscriber.create({
      data: {
        authorId: author.id,
        email,
        name,
        source: isPurchaser ? "purchase" : "book_page",
      },
    });

    if (isPurchaser) {
      // Create 1-3 orders
      const numOrders = Math.random() < 0.2 ? 2 : 1; // 20% buy twice
      let totalSpent = 0;

      for (let j = 0; j < numOrders; j++) {
        const format = pick(formats);
        const orderDate = j === 0
          ? firstSeen
          : randomDate(firstSeen, endDate);

        const order = await db.order.create({
          data: {
            bookId: book.id,
            bookFormatId: format.id,
            readerId: reader.id,
            buyerEmail: email,
            buyerName: name,
            amount: format.price,
            platformFee: Math.round(format.price * 0.2),
            currency: "USD",
            status: Math.random() < 0.3 ? "FULFILLED" : "PAID",
            format: format.type === "EBOOK" || format.type === "LEAF_EDITION" ? "EBOOK" : "PRINT",
            createdAt: orderDate,
            updatedAt: orderDate,
          },
        });

        totalSpent += format.price;

        // Create purchase event
        await db.readerEvent.create({
          data: {
            readerId: reader.id,
            type: "PURCHASED",
            bookId: book.id,
            metadata: {
              amount: format.price,
              formatType: format.type,
              orderId: order.id,
            },
            createdAt: orderDate,
          },
        });

        // Grant reader access for digital
        if (format.type === "EBOOK" || format.type === "LEAF_EDITION") {
          await db.readerAccess.upsert({
            where: { bookId_buyerEmail: { bookId: book.id, buyerEmail: email } },
            create: {
              bookId: book.id,
              buyerEmail: email,
              orderId: order.id,
              accessToken: randomBytes(32).toString("hex"),
            },
            update: {},
          });
        }
      }

      // Update reader stats
      await db.reader.update({
        where: { id: reader.id },
        data: {
          totalSpent,
          orderCount: numOrders,
          status: numOrders > 1 ? "VIP" : "CUSTOMER",
          lastActiveAt: endDate,
        },
      });

      customersCreated++;
    } else if (isGift) {
      // Gift recipient event
      await db.readerEvent.create({
        data: {
          readerId: reader.id,
          type: "GIFT_RECEIVED",
          bookId: book.id,
          metadata: { giftedBy: "friend@example.com" },
          createdAt: randomDate(firstSeen, endDate),
        },
      });

      await db.readerAccess.upsert({
        where: { bookId_buyerEmail: { bookId: book.id, buyerEmail: email } },
        create: {
          bookId: book.id,
          buyerEmail: email,
          accessToken: randomBytes(32).toString("hex"),
          isGift: true,
          giftedBy: "friend@example.com",
        },
        update: {},
      });

      subscribersCreated++;
    } else {
      subscribersCreated++;
    }
  }

  console.log(`Created 50 readers:`);
  console.log(`  ${customersCreated} customers (with orders)`);
  console.log(`  ${subscribersCreated} subscribers/gift recipients`);
  console.log(`\nDone! Refresh http://localhost:3000/readers to see them.`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
