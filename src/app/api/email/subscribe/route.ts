import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const subscribeSchema = z.object({
  authorId: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { authorId, email, name, source } = parsed.data;

  // Verify author exists
  const author = await db.author.findUnique({ where: { id: authorId } });
  if (!author) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  await db.emailSubscriber.upsert({
    where: {
      authorId_email: { authorId, email },
    },
    create: {
      authorId,
      email,
      name: name || null,
      source: source || null,
    },
    update: {}, // Don't overwrite existing subscriber
  });

  return NextResponse.json({ success: true });
}
