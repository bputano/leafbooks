import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

async function getAuthorFromSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.author.findUnique({ where: { userId: session.user.id } });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const author = await getAuthorFromSession();
  if (!author) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bookId } = await params;

  const book = await db.book.findFirst({
    where: { id: bookId, authorId: author.id },
  });
  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bundles = await db.bundle.findMany({
    where: { bookId },
    include: {
      items: {
        include: {
          bookFormat: true,
          bonusMaterial: true,
        },
      },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ bundles });
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().min(0),
  items: z
    .array(
      z.object({
        bookFormatId: z.string().optional(),
        bonusMaterialId: z.string().optional(),
      })
    )
    .optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const author = await getAuthorFromSession();
  if (!author) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bookId } = await params;

  const book = await db.book.findFirst({
    where: { id: bookId, authorId: author.id },
  });
  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const count = await db.bundle.count({ where: { bookId } });

  const bundle = await db.bundle.create({
    data: {
      bookId,
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      order: count,
      items: parsed.data.items
        ? {
            create: parsed.data.items
              .filter((i) => i.bookFormatId || i.bonusMaterialId)
              .map((i) => ({
                bookFormatId: i.bookFormatId || null,
                bonusMaterialId: i.bonusMaterialId || null,
              })),
          }
        : undefined,
    },
    include: {
      items: {
        include: {
          bookFormat: true,
          bonusMaterial: true,
        },
      },
    },
  });

  return NextResponse.json({ bundle }, { status: 201 });
}
