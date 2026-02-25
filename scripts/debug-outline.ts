import * as fs from "fs";
const { PDFParse } = require("pdf-parse");

async function main() {
  const buffer = fs.readFileSync("/home/benp/Lnx Downloads/Great_Founders_Write (1) (1).pdf");
  const parser = new PDFParse(new Uint8Array(buffer));
  await parser.load();
  const info = await parser.getInfo();

  // Print all depth-0 items and check filtering logic
  const outline = info.outline || [];
  const seenTitles = new Set<string>();

  for (const item of outline) {
    const title = item.title?.trim();
    if (!title) { console.log("  SKIP: empty title"); continue; }

    const normalizedTitle = title.toLowerCase();
    if (seenTitles.has(normalizedTitle)) { console.log(`  SKIP duplicate: "${title}"`); continue; }
    seenTitles.add(normalizedTitle);

    const wordCount = title.split(/\s+/).length;
    const isShort = wordCount <= 2;
    const isTLS = isTopLevelSection(title);
    const skip = isShort && !isTLS;

    console.log(`${skip ? "SKIP" : " OK "} "${title}" (${wordCount} words, isTopLevel=${isTLS})`);
  }

  parser.destroy();
}

function isTopLevelSection(title: string): boolean {
  const lower = title.toLowerCase();
  if (/^(chapter|part)\s+\d/i.test(title)) return true;
  if (/^\d+[\s:.]+\w/i.test(title)) return true;
  const namedSections = [
    "introduction", "foreword", "preface", "prologue", "epilogue",
    "conclusion", "postscript", "afterword", "acknowledgments",
    "acknowledgements", "about the author", "appendix", "bibliography",
    "glossary", "index", "table of contents", "dedication", "copyright",
  ];
  for (const name of namedSections) {
    if (lower.startsWith(name)) return true;
  }
  if (/^part\s+/i.test(title)) return true;
  return false;
}

main().catch(console.error);
