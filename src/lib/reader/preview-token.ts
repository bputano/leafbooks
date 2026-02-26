import { createHmac } from "crypto";

const SECRET = process.env.AUTH_SECRET!;
const TOKEN_LENGTH = 16; // 16 hex chars = 8 bytes

function computeHmac(payload: string): string {
  return createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, TOKEN_LENGTH);
}

function buildPayload(bookId: string, sectionSlug: string): string {
  return `preview:${bookId}:${sectionSlug}`;
}

/**
 * Create a deterministic preview token for a book section.
 * The same section always produces the same token.
 */
export function createPreviewToken(
  bookId: string,
  sectionSlug: string
): string {
  return computeHmac(buildPayload(bookId, sectionSlug));
}

/**
 * Verify that a preview token is valid for the given book section.
 */
export function verifyPreviewToken(
  bookId: string,
  sectionSlug: string,
  token: string
): boolean {
  const expected = computeHmac(buildPayload(bookId, sectionSlug));
  return token === expected;
}
