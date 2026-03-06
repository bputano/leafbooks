import { cookies } from "next/headers";
import { verifyAccess, getAccessForEmail } from "./access";
import { getReaderSession } from "./reader-session";

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
 * Checks: 1) URL token, 2) per-book cookie, 3) canopy_session cookie.
 */
export async function checkReaderAccess(
  bookId: string,
  urlToken?: string | null
): Promise<{ hasAccess: boolean; buyerEmail?: string; token?: string }> {
  // 1. Check URL token
  if (urlToken) {
    const result = await verifyAccess(bookId, urlToken);
    if (result.valid) {
      return { hasAccess: true, buyerEmail: result.buyerEmail, token: urlToken };
    }
  }

  // 2. Check per-book cookie (backward compat)
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(getCookieName(bookId))?.value;

  if (cookieToken) {
    const result = await verifyAccess(bookId, cookieToken);
    if (result.valid) {
      return { hasAccess: true, buyerEmail: result.buyerEmail, token: cookieToken };
    }
  }

  // 3. Check unified canopy_session cookie
  const sessionEmail = await getReaderSession();
  if (sessionEmail) {
    const emailAccess = await getAccessForEmail(bookId, sessionEmail);
    if (emailAccess.hasAccess) {
      return {
        hasAccess: true,
        buyerEmail: sessionEmail,
        token: emailAccess.accessToken,
      };
    }
  }

  return { hasAccess: false };
}
