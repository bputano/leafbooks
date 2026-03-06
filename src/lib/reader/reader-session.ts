import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE_NAME = "canopy_session";
const SESSION_DURATION_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

/**
 * Create a unified session for a reader email.
 * Updates ALL Reader records for that email (cross-author).
 */
export async function createReaderSession(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.reader.updateMany({
    where: { email },
    data: { sessionToken: token, sessionExpiresAt: expiresAt },
  });

  return token;
}

/**
 * Verify a session token is valid and not expired.
 */
export async function verifyReaderSession(
  token: string
): Promise<{ valid: true; email: string } | { valid: false }> {
  const reader = await db.reader.findFirst({
    where: {
      sessionToken: token,
      sessionExpiresAt: { gt: new Date() },
    },
    select: { email: true },
  });

  if (!reader) return { valid: false };
  return { valid: true, email: reader.email };
}

/**
 * Set the canopy_session cookie.
 */
export async function setReaderSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
}

/**
 * Read the canopy_session cookie, verify it, return email or null.
 */
export async function getReaderSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const result = await verifyReaderSession(token);
  if (!result.valid) return null;
  return result.email;
}

/**
 * Clear the canopy_session cookie.
 */
export async function clearReaderSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
