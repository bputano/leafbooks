import mammoth from "mammoth";
import JSZip from "jszip";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";

// pdf-parse v2 uses a class-based API with named export
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require("pdf-parse");

export interface Section {
  slug: string;
  heading: string;
  htmlContent: string;
  textContent: string;
  wordCount: number;
}

/**
 * Download manuscript from R2 public URL and convert to structured sections.
 * Supports PDF, EPUB, and DOCX formats.
 * Pure heuristic-based — no AI calls.
 */
export async function processManuscript(
  bookId: string,
  fileUrl: string,
  fileType: string,
  samplePercent: number = 10
): Promise<void> {
  // Download the manuscript
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to download manuscript: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();

  // Convert to sections based on file type
  let sections: Section[];
  switch (fileType) {
    case "pdf":
      sections = await processPdf(buffer);
      break;
    case "epub":
      sections = await processEpub(buffer);
      break;
    case "docx":
      sections = await processDocx(buffer);
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  if (sections.length === 0) {
    throw new Error("No sections could be extracted from the manuscript");
  }

  // Determine which sections are free based on samplePercent
  const totalWords = sections.reduce((sum, s) => sum + s.wordCount, 0);
  const freeWordTarget = Math.ceil(totalWords * (samplePercent / 100));
  let freeWordCount = 0;

  // Delete existing sections and recreate (idempotent)
  await db.bookSection.deleteMany({ where: { bookId } });

  // Create sections in DB
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const isFree = freeWordCount < freeWordTarget;
    freeWordCount += section.wordCount;

    await db.bookSection.create({
      data: {
        bookId,
        order: i,
        slug: section.slug,
        heading: section.heading,
        htmlContent: section.htmlContent,
        textContent: section.textContent,
        wordCount: section.wordCount,
        isFree,
      },
    });
  }
}

// ─── PDF Processing ─────────────────────────────────────

interface PdfOutlineItem {
  title: string;
  dest: Array<{ num: number; gen: number } | { name: string }> | null;
  items: PdfOutlineItem[];
}

interface PdfPage {
  text: string;
  num: number;
}

async function processPdf(buffer: ArrayBuffer): Promise<Section[]> {
  const parser = new PDFParse(new Uint8Array(buffer));
  await parser.load();

  const info = await parser.getInfo();
  const textResult = await parser.getText();
  const pages: PdfPage[] = textResult.pages;
  const outline: PdfOutlineItem[] | undefined = info.outline;

  parser.destroy();

  // Strategy 1: Use PDF outline (bookmarks) if available
  if (outline && outline.length > 0) {
    const sections = await buildSectionsFromOutline(outline, pages);
    if (sections.length > 0) return sections;
  }

  // Strategy 2: Detect chapter headings via regex heuristics
  const sections = await buildSectionsFromHeuristics(pages);
  if (sections.length > 0) return sections;

  // Strategy 3: Fallback — one section per logical group of pages
  return await buildFallbackSections(pages);
}

/**
 * Build sections using the PDF's embedded outline/bookmarks.
 * The outline gives us chapter titles; we match them against page text
 * to determine where each chapter starts.
 */
async function buildSectionsFromOutline(
  outline: PdfOutlineItem[],
  pages: PdfPage[]
): Promise<Section[]> {
  const gemini = getGeminiClient();
  // Flatten the outline to top-level chapters only (skip deep sub-items)
  const chapters = flattenOutlineToChapters(outline);

  if (chapters.length === 0) return [];

  // Find the page index where each chapter heading appears
  const chapterPages: Array<{ title: string; pageIndex: number }> = [];

  for (const chapter of chapters) {
    const pageIndex = findHeadingInPages(chapter.title, pages);
    if (pageIndex !== -1) {
      chapterPages.push({ title: chapter.title, pageIndex });
    }
  }

  if (chapterPages.length === 0) return [];

  // Sort by page index
  chapterPages.sort((a, b) => a.pageIndex - b.pageIndex);

  // Build sections: each chapter runs from its start page to the next chapter's start
  const sections: Section[] = [];
  const usedSlugs = new Set<string>();

  for (let i = 0; i < chapterPages.length; i++) {
    const chapter = chapterPages[i];
    const nextChapter = chapterPages[i + 1];
    const startPage = chapter.pageIndex;
    const endPage = nextChapter ? nextChapter.pageIndex : pages.length;

    // Collect text from all pages in this chapter
    const pageTexts = pages
      .slice(startPage, endPage)
      .map((p) => p.text)
      .join("\n\n");

    // Remove the heading from the body text if it appears at the start
    const textContent = removeHeadingFromText(chapter.title, pageTexts).trim();
    if (!textContent) continue;

    const heading = cleanHeading(chapter.title);
    const htmlContent = await formatWithGemini(textContent, gemini, chapter.title, heading);

    let slug = slugify(chapter.title);
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${i + 1}`;
    }
    usedSlugs.add(slug);

    sections.push({
      slug,
      heading: cleanHeading(chapter.title),
      htmlContent,
      textContent,
      wordCount: countWords(textContent),
    });
  }

  // Capture any content before the first chapter as front matter
  if (chapterPages[0].pageIndex > 0) {
    const frontPages = pages.slice(0, chapterPages[0].pageIndex);
    const frontText = frontPages
      .map((p) => p.text)
      .join("\n\n")
      .trim();
    if (frontText && countWords(frontText) > 20) {
      sections.unshift({
        slug: "front-matter",
        heading: "Front Matter",
        htmlContent: await formatWithGemini(frontText, gemini, "Front Matter"),
        textContent: frontText,
        wordCount: countWords(frontText),
      });
    }
  }

  return sections;
}

/**
 * Flatten a nested PDF outline into a flat list of top-level chapters.
 * PDF authors typically put chapters at depth 0 and sub-sections as children.
 * We take all depth-0 items as chapters, skipping obvious non-content items
 * (duplicates, very short metadata like author names).
 */
function flattenOutlineToChapters(
  outline: PdfOutlineItem[]
): Array<{ title: string; depth: number }> {
  const result: Array<{ title: string; depth: number }> = [];
  const seenTitles = new Set<string>();

  for (const item of outline) {
    const title = item.title?.trim();
    if (!title) continue;

    // Skip duplicates (some PDFs repeat the book title)
    const normalizedTitle = title.toLowerCase();
    if (seenTitles.has(normalizedTitle)) continue;
    seenTitles.add(normalizedTitle);

    // Skip very short items that are likely metadata (author name, subtitle)
    // unless they're known section names
    if (title.split(/\s+/).length <= 2 && !isTopLevelSection(title)) continue;

    result.push({ title, depth: 0 });
  }

  return result;
}

/**
 * Determine if an outline item title represents a top-level section
 * that should be its own page in the reader.
 */
function isTopLevelSection(title: string): boolean {
  const lower = title.toLowerCase();

  // Common chapter patterns
  if (/^(chapter|part)\s+\d/i.test(title)) return true;
  if (/^\d+[\s:.]+\w/i.test(title)) return true; // "1 Title", "1: Title", "1. Title"

  // Named sections
  const namedSections = [
    "introduction",
    "foreword",
    "preface",
    "prologue",
    "epilogue",
    "conclusion",
    "postscript",
    "afterword",
    "acknowledgments",
    "acknowledgements",
    "about the author",
    "appendix",
    "bibliography",
    "glossary",
    "index",
    "table of contents",
    "dedication",
    "copyright",
  ];
  for (const name of namedSections) {
    if (lower.startsWith(name)) return true;
  }

  // "Part N" sections
  if (/^part\s+/i.test(title)) return true;

  return false;
}

/**
 * Find the page index where a heading appears in the page text.
 * Uses multi-pass matching: first looks for the heading as a standalone line
 * near the top of a page, then falls back to fuzzy substring matching.
 * This avoids false matches on Table of Contents pages.
 */
function findHeadingInPages(
  heading: string,
  pages: PdfPage[]
): number {
  const collapsedHeading = heading.toLowerCase().replace(/\s+/g, "");

  // Pass 1: Look for the heading as a standalone line in the first 10 lines
  // of a page. This is the strongest signal — chapter headings are at the top.
  for (let i = 0; i < pages.length; i++) {
    const lines = pages[i].text.split("\n").slice(0, 10);
    for (const line of lines) {
      const collapsedLine = line.toLowerCase().replace(/\s+/g, "");
      // Check if the line IS the heading (not just contains it)
      if (
        collapsedLine === collapsedHeading ||
        // Allow the line to have minor extra chars (punctuation, numbers)
        (collapsedLine.length > 3 &&
          collapsedLine.length <= collapsedHeading.length * 1.3 &&
          collapsedLine.includes(collapsedHeading))
      ) {
        return i;
      }
    }
  }

  // Pass 2: Broader match — heading appears somewhere in the page but NOT
  // on a page that looks like a table of contents (many short lines with dots/numbers)
  for (let i = 0; i < pages.length; i++) {
    const pageText = pages[i].text;
    const collapsedPage = pageText.toLowerCase().replace(/\s+/g, "");

    if (!collapsedPage.includes(collapsedHeading)) continue;

    // Skip pages that look like a TOC (many lines with dot leaders or page numbers)
    const lines = pageText.split("\n").filter((l) => l.trim());
    const dotLines = lines.filter((l) => /\.{3,}/.test(l) || /\.\s*\d+\s*$/.test(l));
    if (dotLines.length > 3) continue; // Likely a TOC page

    return i;
  }

  return -1;
}

/**
 * Build sections by detecting chapter headings via regex patterns
 * when no PDF outline is available.
 */
async function buildSectionsFromHeuristics(pages: PdfPage[]): Promise<Section[]> {
  const gemini = getGeminiClient();
  const chapterPattern =
    /^(?:(?:chapter|part)\s+\d+[:\s].*|(?:introduction|foreword|preface|prologue|epilogue|conclusion|postscript|afterword|acknowledgments|acknowledgements|about the author|appendix|bibliography|glossary)(?:[:\s].*)?)/i;

  const chapterStarts: Array<{ title: string; pageIndex: number }> = [];

  for (let i = 0; i < pages.length; i++) {
    const lines = pages[i].text.split("\n").map((l) => l.trim()).filter(Boolean);
    // Check the first few lines of each page for chapter headings
    for (const line of lines.slice(0, 5)) {
      if (chapterPattern.test(line) && line.length < 100) {
        chapterStarts.push({ title: line, pageIndex: i });
        break;
      }
    }
  }

  if (chapterStarts.length === 0) return [];

  const sections: Section[] = [];
  const usedSlugs = new Set<string>();

  for (let i = 0; i < chapterStarts.length; i++) {
    const start = chapterStarts[i];
    const end = chapterStarts[i + 1];
    const startPage = start.pageIndex;
    const endPage = end ? end.pageIndex : pages.length;

    const pageTexts = pages
      .slice(startPage, endPage)
      .map((p) => p.text)
      .join("\n\n");

    const textContent = removeHeadingFromText(start.title, pageTexts).trim();
    if (!textContent) continue;

    let slug = slugify(start.title);
    if (usedSlugs.has(slug)) slug = `${slug}-${i + 1}`;
    usedSlugs.add(slug);

    sections.push({
      slug,
      heading: cleanHeading(start.title),
      htmlContent: await formatWithGemini(textContent, gemini),
      textContent,
      wordCount: countWords(textContent),
    });
  }

  return sections;
}

/**
 * Fallback: split into one big section if nothing else works.
 */
async function buildFallbackSections(pages: PdfPage[]): Promise<Section[]> {
  const gemini = getGeminiClient();
  const fullText = pages.map((p) => p.text).join("\n\n").trim();
  if (!fullText) return [];

  return [
    {
      slug: "full-text",
      heading: "Full Text",
      htmlContent: await formatWithGemini(fullText, gemini),
      textContent: fullText,
      wordCount: countWords(fullText),
    },
  ];
}

// ─── EPUB Processing ────────────────────────────────────

async function processEpub(buffer: ArrayBuffer): Promise<Section[]> {
  const zip = await JSZip.loadAsync(buffer);

  // 1. Find the OPF file via container.xml
  const containerXml = await zip
    .file("META-INF/container.xml")
    ?.async("string");
  if (!containerXml) {
    throw new Error("Invalid EPUB: missing META-INF/container.xml");
  }

  const opfPathMatch = containerXml.match(/full-path="([^"]+)"/);
  if (!opfPathMatch) {
    throw new Error("Invalid EPUB: cannot find OPF path");
  }
  const opfPath = opfPathMatch[1];
  const opfDir = opfPath.includes("/")
    ? opfPath.substring(0, opfPath.lastIndexOf("/") + 1)
    : "";

  // 2. Parse the OPF to get manifest and spine
  const opfXml = await zip.file(opfPath)?.async("string");
  if (!opfXml) {
    throw new Error(`Invalid EPUB: missing OPF file at ${opfPath}`);
  }

  // Extract manifest items (id → href mapping)
  const manifest = new Map<string, string>();
  const manifestRegex = /<item\s+[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*/g;
  for (const match of opfXml.matchAll(manifestRegex)) {
    manifest.set(match[1], match[2]);
  }

  // Extract spine order (list of itemref idref values)
  const spineRefs: string[] = [];
  const spineRegex = /<itemref\s+[^>]*idref="([^"]+)"/g;
  for (const match of opfXml.matchAll(spineRegex)) {
    spineRefs.push(match[1]);
  }

  // 3. Read each spine item's XHTML content in order
  const sections: Section[] = [];
  const usedSlugs = new Set<string>();

  for (const ref of spineRefs) {
    const href = manifest.get(ref);
    if (!href) continue;

    const filePath = opfDir + decodeURIComponent(href);
    const xhtml = await zip.file(filePath)?.async("string");
    if (!xhtml) continue;

    // Extract the body content
    const bodyMatch = xhtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : xhtml;

    // Extract title from first heading or <title> tag
    const headingMatch = bodyHtml.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
    const titleMatch = xhtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const heading =
      stripHtml(headingMatch?.[1] || "") ||
      stripHtml(titleMatch?.[1] || "") ||
      `Section ${sections.length + 1}`;

    // Clean the HTML: remove scripts, styles, but keep content tags
    const cleanedHtml = bodyHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .trim();

    const textContent = stripHtml(cleanedHtml);
    if (countWords(textContent) < 5) continue; // Skip near-empty sections

    let slug = slugify(heading);
    if (usedSlugs.has(slug)) slug = `${slug}-${sections.length + 1}`;
    usedSlugs.add(slug);

    sections.push({
      slug,
      heading: cleanHeading(heading),
      htmlContent: cleanedHtml,
      textContent,
      wordCount: countWords(textContent),
    });
  }

  return sections;
}

// ─── DOCX Processing ────────────────────────────────────

async function processDocx(buffer: ArrayBuffer): Promise<Section[]> {
  const result = await mammoth.convertToHtml(
    { buffer: Buffer.from(buffer) },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Title'] => h1:fresh",
      ],
    }
  );

  const html = result.value;
  const sections = splitHtmlOnHeadings(html);

  if (sections.length === 0) {
    const text = stripHtml(html);
    return [
      {
        slug: "full-text",
        heading: "Full Text",
        htmlContent: html,
        textContent: text,
        wordCount: countWords(text),
      },
    ];
  }

  return sections;
}

function splitHtmlOnHeadings(html: string): Section[] {
  const headingRegex = /<h[12][^>]*>(.*?)<\/h[12]>/gi;
  const matches = [...html.matchAll(headingRegex)];

  if (matches.length === 0) return [];

  const sections: Section[] = [];
  const usedSlugs = new Set<string>();

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];
    const heading = stripHtml(match[1]);
    const startIdx = match.index!;
    const endIdx = nextMatch ? nextMatch.index! : html.length;
    const sectionHtml = html.slice(startIdx, endIdx);
    const textContent = stripHtml(sectionHtml);

    let slug = slugify(heading);
    if (usedSlugs.has(slug)) slug = `${slug}-${i + 1}`;
    usedSlugs.add(slug);

    sections.push({
      slug,
      heading,
      htmlContent: sectionHtml,
      textContent,
      wordCount: countWords(textContent),
    });
  }

  // Content before first heading → front matter
  const firstHeadingIdx = matches[0].index!;
  if (firstHeadingIdx > 0) {
    const preambleHtml = html.slice(0, firstHeadingIdx).trim();
    if (preambleHtml.length > 50) {
      const text = stripHtml(preambleHtml);
      sections.unshift({
        slug: "front-matter",
        heading: "Front Matter",
        htmlContent: preambleHtml,
        textContent: text,
        wordCount: countWords(text),
      });
    }
  }

  return sections;
}

// ─── Text Pre-Processing ─────────────────────────────────

/**
 * Clean raw PDF text before sending to Gemini.
 * Fixes common PDF extraction artifacts that confuse the formatter.
 */
function preprocessPdfText(text: string): string {
  let cleaned = text;

  // 1. Rejoin hyphenated line breaks: "solu-\ntion" → "solution"
  cleaned = cleaned.replace(/(\w)-\n(\w)/g, "$1$2");

  // 2. Collapse spaced-out text in ALL CAPS lines.
  //    PDF letter-spacing creates patterns like "S T O R Y T E L L I N G" or partial
  //    ones like "G R E AT" or "IMPOR TA NT". Process line-by-line for lines that
  //    appear to be styled headings (mostly uppercase with unusual spacing).
  cleaned = cleaned
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      // Detect lines that look like spaced-out headings:
      // Mostly uppercase, with single spaces between many individual letters
      const upperRatio =
        trimmed.replace(/\s/g, "").length > 0
          ? (trimmed.replace(/[^A-Z]/g, "").length /
              trimmed.replace(/\s/g, "").length)
          : 0;
      if (upperRatio > 0.7 && trimmed.length > 5) {
        // Remove all single spaces between uppercase letters
        // This handles "G R E AT" → "GREAT", "THELANGU AG E" → "THELANGUAGE"
        let collapsed = trimmed.replace(/([A-Z]) ([A-Z])/g, "$1$2");
        // Run multiple passes since the regex skips overlapping matches
        while (/([A-Z]) ([A-Z])/.test(collapsed)) {
          collapsed = collapsed.replace(/([A-Z]) ([A-Z])/g, "$1$2");
        }
        return collapsed;
      }
      return line;
    })
    .join("\n");

  // 3. Remove standalone page numbers (lines that are just a number)
  cleaned = cleaned.replace(/^\s*\d{1,3}\s*$/gm, "");

  // 4. Remove running headers/footers that repeat the book or chapter title with page numbers
  cleaned = cleaned.replace(/^[a-z\s]{20,}\d{1,3}\s*$/gm, "");
  cleaned = cleaned.replace(/^\d{1,3}\s+[a-z\s]{10,}$/gm, "");

  // 5. Clean up excessive blank lines left by removals
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

// ─── Gemini Formatting ───────────────────────────────────

const GEMINI_FORMAT_PROMPT = `You are a book formatting assistant. Convert the following text from a book chapter into clean, well-structured HTML for a web-based ebook reader.

The text was extracted from a PDF and has artifacts you MUST fix.

Rules:
- Output ONLY the HTML body content (no <html>, <head>, <body> tags, no markdown fences)
- Use semantic HTML tags:
  - <p> for paragraphs (merge lines that are part of the same paragraph)
  - <h2> for major subheadings within the chapter
  - <h3> for minor subheadings
  - <blockquote> for quotations (especially lines starting with quotes or attributed to someone)
  - <ul>/<ol> with <li> for lists
  - <em> for emphasized/italic text
  - <strong> for bold text

CRITICAL — Fix these PDF artifacts:
- Broken line breaks: PDF extraction splits lines mid-sentence. Rejoin them into flowing paragraphs.
- ALL CAPS headings: Convert headings from ALL CAPS to Title Case. For example "THEMASTERSKILL" → "The Master Skill", "BATTLINGCHAOSWITHCLARITY" → "Battling Chaos with Clarity"
- Concatenated words in headings: PDF extraction sometimes removes spaces between words. If a heading looks like "DEFININGAPOWERFULPURPOSE", split it into proper words: "Defining a Powerful Purpose"
- Remove any stray page numbers or running headers/footers
- Example emails, letters, or sample text: wrap these in <blockquote> tags to visually distinguish them from the main body text. Look for "Subject:" lines, "Dear...", "From:", etc.
- Preserve the author's actual words in body text — do not rephrase
- Do not add any commentary or explanation — output pure HTML only`;

/**
 * Post-process Gemini HTML output to fix remaining issues:
 * 1. Convert ALL CAPS headings to Title Case
 * 2. Remove orphaned first heading if it duplicates the chapter title
 */
function postprocessHtml(html: string, chapterHeading?: string): string {
  let result = html;

  // 1. Remove orphaned first heading that duplicates the chapter title.
  //    e.g. Chapter heading "3 Sell With Storytelling" and first h2 is "Storytelling"
  if (chapterHeading) {
    const firstH2Match = result.match(/^\s*<h[23][^>]*>(.*?)<\/h[23]>/i);
    if (firstH2Match) {
      const h2Text = firstH2Match[1].replace(/<[^>]+>/g, "").trim().toLowerCase();
      const chapterLower = chapterHeading.toLowerCase();
      // Remove if the h2 text is contained within the chapter heading
      // or is very similar (e.g. "Storytelling" within "3 Sell With Storytelling")
      if (
        chapterLower.includes(h2Text) ||
        h2Text.includes(chapterLower) ||
        // Also catch single-word orphans that are part of the heading
        (h2Text.split(/\s+/).length <= 2 &&
          chapterLower
            .split(/\s+/)
            .some((w) => h2Text.includes(w) && w.length > 3))
      ) {
        result = result.replace(firstH2Match[0], "").trimStart();
      }
    }
  }

  // 2. Convert ALL CAPS headings to Title Case
  result = result.replace(
    /(<h[2345][^>]*>)(.*?)(<\/h[2345]>)/gi,
    (_match, open: string, content: string, close: string) => {
      let text = content.replace(/<[^>]+>/g, "").trim();

      const letters = text.replace(/[^a-zA-Z]/g, "");
      const upperCount = letters.replace(/[^A-Z]/g, "").length;
      if (letters.length > 3 && upperCount / letters.length > 0.8) {
        text = toTitleCase(text);
      }

      return `${open}${text}${close}`;
    }
  );

  return result;
}

/**
 * Convert a string to Title Case, keeping small words lowercase
 * unless they're the first word.
 */
function toTitleCase(str: string): string {
  const smallWords = new Set([
    "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at",
    "to", "by", "in", "of", "up", "as", "is", "it", "so", "no",
    "do", "if", "my", "we", "us",
  ]);

  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) => {
      if (i === 0 || !smallWords.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(" ");
}

/**
 * Format raw PDF text into clean HTML using Gemini 2.0 Flash.
 * Retries on 429 rate limit errors with exponential backoff.
 * Falls back to simple textToHtml() if Gemini is unavailable.
 */
async function formatWithGemini(
  text: string,
  gemini: GoogleGenerativeAI | null,
  label?: string,
  chapterHeading?: string
): Promise<string> {
  if (!gemini) return textToHtml(text);

  const wordCount = text.split(/\s+/).length;
  const tag = label ? ` [${label}]` : "";
  console.log(`  Gemini: formatting${tag} (${wordCount} words)...`);

  const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });
  const maxRetries = 5;
  const processedText = preprocessPdfText(text);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent([
        GEMINI_FORMAT_PROMPT,
        processedText,
      ]);
      const html = result.response.text().trim();

      // Strip markdown code fences if the model wraps output in them
      const cleaned = html
        .replace(/^```html?\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "")
        .trim();

      // Sanity check: if response is empty or suspiciously short, fall back
      if (!cleaned || cleaned.length < text.length * 0.1) {
        console.warn(`  Gemini returned suspiciously short output${tag}, using fallback`);
        return textToHtml(text);
      }

      return postprocessHtml(cleaned, chapterHeading);
    } catch (error: unknown) {
      const is429 =
        error instanceof Error &&
        (error.message?.includes("429") || error.message?.includes("Resource exhausted"));

      if (is429 && attempt < maxRetries) {
        const delay = Math.min(5000 * Math.pow(2, attempt), 60000);
        console.log(`  Rate limited${tag}, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      console.warn(`  Gemini formatting failed${tag}, using fallback:`, error instanceof Error ? error.message : error);
      return textToHtml(text);
    }
  }

  return textToHtml(text);
}

/**
 * Initialize Gemini client if API key is available.
 */
function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not set — PDF formatting will use basic fallback");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

// ─── Helpers ────────────────────────────────────────────

/**
 * Convert plain text to semantic HTML paragraphs.
 * Simple fallback when Gemini is unavailable.
 */
function textToHtml(text: string): string {
  // Split into paragraphs on double newlines
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Remove the chapter heading from the start of body text.
 */
function removeHeadingFromText(heading: string, text: string): string {
  const normalizedHeading = heading.toLowerCase().replace(/\s+/g, "");
  const lines = text.split("\n");
  const result: string[] = [];
  let foundHeading = false;

  for (const line of lines) {
    if (!foundHeading) {
      const normalizedLine = line.toLowerCase().replace(/\s+/g, "");
      if (
        normalizedLine.includes(normalizedHeading) ||
        normalizedHeading.includes(normalizedLine) && normalizedLine.length > 3
      ) {
        foundHeading = true;
        continue;
      }
    }
    result.push(line);
  }

  return result.join("\n");
}

/**
 * Clean up a heading: remove excessive spacing (e.g. "C H A P T E R" → "CHAPTER"),
 * trim whitespace, normalize number prefixes.
 */
function cleanHeading(title: string): string {
  // Detect spaced-out text like "T A B L E   O F   C O N T E N T S"
  // If most characters are separated by spaces, collapse them
  const words = title.split(/\s{2,}/);
  const cleaned = words
    .map((w) => {
      if (/^[A-Z]( [A-Z])+$/.test(w)) {
        return w.replace(/ /g, "");
      }
      return w;
    })
    .join(" ");

  return cleaned.trim();
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "section"
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
