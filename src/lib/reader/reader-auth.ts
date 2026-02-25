import { cookies } from "next/headers";
import { verifyAccess } from "./access";

const COOKIE_PREFIX = "leaf_reader_";

/**
 * Get the cookie name for a book's reader access.
 */
function getCookieName(bookId: string): string {
  return `${COOKIE_PREFIX}${bookId}`;
}

/**
 * Store the reader access token in an httpOnly cookie.
 */
export async function setReaderCookie(
  bookId: string,
  accessToken: string
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(getCookieName(bookId), accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
}

/**
 * Check if the current request has valid reader access for a book.
 * Checks both cookie and URL token parameter.
 * Note: Cannot set cookies from Server Components — use setReaderCookie
 * in a Route Handler or Server Action instead.
 */
export async function checkReaderAccess(
  bookId: string,
  urlToken?: string | null
): Promise<{ hasAccess: boolean; buyerEmail?: string; token?: string }> {
  // First check URL token
  if (urlToken) {
    const result = await verifyAccess(bookId, urlToken);
    if (result.valid) {
      return { hasAccess: true, buyerEmail: result.buyerEmail, token: urlToken };
    }
  }

  // Check cookie
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(getCookieName(bookId))?.value;

  if (cookieToken) {
    const result = await verifyAccess(bookId, cookieToken);
    if (result.valid) {
      return { hasAccess: true, buyerEmail: result.buyerEmail, token: cookieToken };
    }
  }

  return { hasAccess: false };
}
