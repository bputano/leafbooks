import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createBookSchema = z.object({
  title: z.string().min(1).default("Untitled"),
});

// GET — list author's books
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const author = await db.author.findUnique({
    where: { userId: session.user.id },
  });
  if (!author) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  const books = await db.book.findMany({
    where: { authorId: author.id },
    include: { formats: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ books });
}

// POST — create a new book (starts wizard)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const author = await db.author.findUnique({
    where: { userId: session.user.id },
  });
  if (!author) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createBookSchema.safeParse(body);
  const title = parsed.success ? parsed.data.title : "Untitled";

  // Generate unique slug
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) slug = "untitled";

  let finalSlug = slug;
  let counter = 1;
  while (
    await db.book.findFirst({
      where: { authorId: author.id, slug: finalSlug },
    })
  ) {
    finalSlug = `${slug}-${counter++}`;
  }

  const book = await db.book.create({
    data: {
      authorId: author.id,
      title,
      slug: finalSlug,
      wizardStep: 1,
    },
  });

  return NextResponse.json({ book }, { status: 201 });
}
