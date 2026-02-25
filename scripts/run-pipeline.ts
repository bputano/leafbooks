/**
 * Run the content pipeline on the Great Founders Write PDF.
 */
import { processManuscript } from "../src/lib/reader/content-pipeline";
import { db } from "../src/lib/db";

const BOOK_ID = "cmljin03z0004m94lj19zp0wb";
const FILE_URL = "http://localhost:8899/manuscript.pdf";

async function main() {
  console.log("Starting content pipeline...");
  console.log(`Book ID: ${BOOK_ID}`);
  console.log(`File URL: ${FILE_URL}`);

  try {
    await processManuscript(BOOK_ID, FILE_URL, "pdf", 10);
    console.log("\nPipeline complete!");

    const sections = await db.bookSection.findMany({
      where: { bookId: BOOK_ID },
      orderBy: { order: "asc" },
      select: { slug: true, heading: true, wordCount: true, isFree: true, order: true },
    });

    console.log(`\nCreated ${sections.length} sections:`);
    for (const s of sections) {
      console.log(`  [${s.order}] ${s.heading} (${s.slug}) — ${s.wordCount} words, free=${s.isFree}`);
    }
  } catch (err) {
    console.error("Pipeline failed:", err);
  } finally {
    await db.$disconnect();
  }
}

main();
