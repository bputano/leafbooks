/**
 * Seed a test book for design review.
 * Creates author + book + formats + sections from the Great Founders Write PDF.
 *
 * Usage: npx tsx scripts/seed-test-book.ts
 */
import { db } from "../src/lib/db";
import { processManuscript } from "../src/lib/reader/content-pipeline";
import { readFileSync } from "fs";
import { createServer } from "http";
import { resolve } from "path";

const PDF_PATH = resolve(__dirname, "../tests/Great_Founders_Write (1) (2).pdf");
const COVER_PATH = resolve(__dirname, "../tests/6ffcc8c4-dff9-4c8f-99fb-1b060230a6af (2) (2).pdf");

async function main() {
  console.log("Seeding test book for design review...\n");

  // 1. Create or find test user + author
  let user = await db.user.findFirst({
    where: { emails: { some: { email: "test@serif.com" } } },
    include: { author: true },
  });

  if (!user) {
    console.log("Creating test user + author...");
    user = await db.user.create({
      data: {
        name: "Ben Putano",
        emails: {
          create: {
            email: "test@serif.com",
            isPrimary: true,
            verified: true,
          },
        },
        author: {
          create: {
            displayName: "Ben Putano",
            slug: "ben-putano",
            bio: "Author, founder, and writer. I help founders communicate clearly and build better companies through writing.",
            // Fake stripe ID to pass publish validation
            stripeAccountId: "acct_test_seed",
          },
        },
      },
      include: { author: true },
    });
    console.log(`  Created user: ${user.id}`);
    console.log(`  Created author: ${user.author!.slug}`);
  } else {
    console.log(`  Found existing user: ${user.id}, author: ${user.author?.slug}`);
  }

  const author = user.author!;

  // 2. Create or find the book
  let book = await db.book.findFirst({
    where: { authorId: author.id, slug: "great-founders-write" },
  });

  if (!book) {
    console.log("\nCreating book...");
    book = await db.book.create({
      data: {
        authorId: author.id,
        title: "Great Founders Write",
        subtitle: "Principles for Clear Thinking, Confident Writing, and Startup Success",
        description:
          "Most founders dread writing. They see it as a chore—something to delegate or avoid. But the best founders write constantly. They write to think, to persuade, to recruit, to sell. This book shows you how to make writing your superpower.\n\nGreat Founders Write is a practical guide for startup founders who want to communicate more clearly, think more rigorously, and build companies that last. Drawing on lessons from some of the most successful founders in history, this book gives you the principles and frameworks to become a better writer—and a better founder.",
        slug: "great-founders-write",
        status: "PUBLISHED",
        wizardStep: 6,
        keywords: ["writing", "startups", "founders", "communication", "leadership"],
        bisacCodes: ["BUS060000"],
        isbn: "979-8-9873051-0-8",
        manuscriptFileType: "pdf",
      },
    });
    console.log(`  Created book: ${book.id} (${book.slug})`);
  } else {
    console.log(`  Found existing book: ${book.id}`);
    // Reset to published
    await db.book.update({
      where: { id: book.id },
      data: { status: "PUBLISHED", wizardStep: 6 },
    });
  }

  // 3. Create formats
  const existingFormats = await db.bookFormat.findMany({
    where: { bookId: book.id },
  });

  if (existingFormats.length === 0) {
    console.log("\nCreating formats...");
    await db.bookFormat.createMany({
      data: [
        {
          bookId: book.id,
          type: "PAPERBACK",
          price: 1699,
          isActive: true,
          trimSize: "5.5x8.5",
          paperType: "cream",
          bindingType: "perfect_bound",
          interiorColor: "bw",
        },
        {
          bookId: book.id,
          type: "EBOOK",
          price: 999,
          isActive: true,
        },
        {
          bookId: book.id,
          type: "LEAF_EDITION",
          price: 799,
          isActive: true,
        },
      ],
    });
    console.log("  Created 3 formats (Paperback $16.99, Ebook $9.99, Serif Edition $7.99)");
  } else {
    console.log(`  ${existingFormats.length} formats already exist`);
  }

  // 4. Process manuscript into sections
  const existingSections = await db.bookSection.count({
    where: { bookId: book.id },
  });

  if (existingSections === 0) {
    console.log("\nProcessing manuscript into sections...");
    console.log("  (This uses Gemini for formatting — may take a minute)\n");

    // Serve the PDF locally for the content pipeline
    const pdfBuffer = readFileSync(PDF_PATH);
    const server = createServer((req, res) => {
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Length": pdfBuffer.length,
      });
      res.end(pdfBuffer);
    });

    await new Promise<void>((resolve) => server.listen(8899, resolve));
    console.log("  Local file server on :8899");

    try {
      await processManuscript(book.id, "http://localhost:8899/manuscript.pdf", "pdf", 15);

      const sections = await db.bookSection.findMany({
        where: { bookId: book.id },
        orderBy: { order: "asc" },
        select: { slug: true, heading: true, wordCount: true, isFree: true },
      });

      console.log(`\n  Created ${sections.length} sections:`);
      for (const s of sections) {
        console.log(`    ${s.isFree ? "FREE" : "    "} ${s.heading} (${s.wordCount} words)`);
      }
    } finally {
      server.close();
    }
  } else {
    console.log(`\n  ${existingSections} sections already exist, skipping processing`);
  }

  // 5. Summary
  console.log("\n────────────────────────────────────────");
  console.log("Done! View the redesigned pages at:\n");
  console.log(`  Book page:    http://localhost:3002/${author.slug}/${book.slug}`);
  console.log(`  Serif Reader: http://localhost:3002/${author.slug}/${book.slug}/read`);
  console.log("────────────────────────────────────────\n");

  await db.$disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
