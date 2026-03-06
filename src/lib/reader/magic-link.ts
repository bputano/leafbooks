import { randomBytes } from "crypto";
import { db } from "@/lib/db";

const EXPIRY_MINUTES = 15;

/**
 * Create a magic link for a reader to authenticate.
 * Returns the token and full URL. In dev mode the URL is shown to the user.
 */
export async function createMagicLink(
  email: string
): Promise<{ token: string; url: string }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  await db.magicLink.create({
    data: { email, token, expiresAt },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/reader/auth/verify?token=${token}`;

  return { token, url };
}

/**
 * Verify a magic link token. Marks it as used if valid.
 * Returns the email or null.
 */
export async function verifyMagicLink(
  token: string
): Promise<string | null> {
  const link = await db.magicLink.findUnique({ where: { token } });

  if (!link) return null;
  if (link.usedAt) return null;
  if (link.expiresAt < new Date()) return null;

  await db.magicLink.update({
    where: { id: link.id },
    data: { usedAt: new Date() },
  });

  return link.email;
}
