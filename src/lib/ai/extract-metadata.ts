import Anthropic from "@anthropic-ai/sdk";
import { PDFDocument } from "pdf-lib";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractedMetadata {
  title?: string;
  subtitle?: string;
  authorName?: string;
  description?: string;
  keywords?: string[];
  bisacCodes?: string[];
  isbn?: string;
  isbns?: { hardcover?: string; paperback?: string; ebook?: string };
  pageCount?: number;
}

// Max size for document content sent to Claude (32MB base64 limit, ~24MB raw)
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
const MAX_PDF_PAGES = 50; // Claude API limit is 100, use 50 for metadata

async function truncatePdf(buffer: ArrayBuffer): Promise<{ data: Uint8Array; totalPages: number }> {
  const srcDoc = await PDFDocument.load(buffer);
  const totalPages = srcDoc.getPageCount();

  if (totalPages <= MAX_PDF_PAGES) {
    return { data: new Uint8Array(buffer), totalPages };
  }

  // Copy only the first N pages
  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(srcDoc, Array.from({ length: MAX_PDF_PAGES }, (_, i) => i));
  for (const page of pages) {
    newDoc.addPage(page);
  }
  const data = await newDoc.save();
  return { data, totalPages };
}

export async function extractMetadataFromManuscript(
  fileUrl: string,
  fileType: string
): Promise<ExtractedMetadata> {
  try {
    // Fetch the file to pass to Claude
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch manuscript file");
    }

    const buffer = await response.arrayBuffer();

    // Check file size — Claude has limits on document size
    if (buffer.byteLength > MAX_FILE_SIZE) {
      console.warn(
        `Manuscript too large (${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB), skipping extraction`
      );
      return {};
    }

    if (fileType === "pdf") {
      // Truncate to first 50 pages if needed (Claude API limit is 100)
      const { data, totalPages } = await truncatePdf(buffer);
      const base64 = Buffer.from(data).toString("base64");

      // Use Claude's native PDF document understanding
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document" as const,
                source: {
                  type: "base64" as const,
                  media_type: "application/pdf" as const,
                  data: base64,
                },
              },
              {
                type: "text" as const,
                text: EXTRACTION_PROMPT + (totalPages > MAX_PDF_PAGES
                  ? `\n\nNote: This PDF has ${totalPages} total pages. You are seeing the first ${MAX_PDF_PAGES} pages.`
                  : `\n\nThis PDF has ${totalPages} pages.`),
              },
            ],
          },
        ],
      });

      const result = parseResponse(message);
      if (!result.pageCount && totalPages) {
        result.pageCount = totalPages;
      }
      return result;
    }

    // For non-PDF files (DOCX, EPUB), extract as text
    // DOCX and EPUB are zip-based formats — send raw text content
    const textContent = Buffer.from(buffer).toString("utf-8").slice(0, 50000);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text" as const,
              text: `Document content (${fileType} format, text extracted):\n\n${textContent}`,
            },
            {
              type: "text" as const,
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    return parseResponse(message);
  } catch (error) {
    console.error("Metadata extraction failed:", error);
    return {};
  }
}

const EXTRACTION_PROMPT = `Extract the following metadata from this book manuscript. Return a JSON object with these fields:
- title: The book's title
- subtitle: The book's subtitle (if any)
- authorName: The author's name
- description: A compelling 2-3 sentence book description suitable for a sales page
- keywords: An array of 5-10 relevant keywords/topics
- bisacCodes: An array of likely BISAC category codes (e.g., "SEL027000" for Self-Help / Personal Growth)
- isbn: Primary ISBN if found on copyright page (null if not found)
- isbns: Object mapping format to ISBN if multiple are listed, e.g. {"hardcover": "978-...", "paperback": "978-...", "ebook": "978-..."}. Null if not found or only one ISBN.
- pageCount: Estimated page count if determinable

Return ONLY valid JSON, no other text.`;

function parseResponse(message: Anthropic.Message): ExtractedMetadata {
  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Parse JSON from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {};
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    title: parsed.title || undefined,
    subtitle: parsed.subtitle || undefined,
    authorName: parsed.authorName || undefined,
    description: parsed.description || undefined,
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : undefined,
    bisacCodes: Array.isArray(parsed.bisacCodes)
      ? parsed.bisacCodes
      : undefined,
    isbn: parsed.isbn || undefined,
    isbns: parsed.isbns || undefined,
    pageCount: parsed.pageCount || undefined,
  };
}
