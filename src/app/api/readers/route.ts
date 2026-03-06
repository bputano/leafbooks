import { NextRequest, NextResponse } from "next/server";
import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";
import { upsertReader, recordReaderEvent } from "@/lib/readers";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// GET /api/readers — list readers with filters
export async function GET(req: NextRequest) {
  const author = await getAuthor();
  const url = req.nextUrl;

  const status = url.searchParams.get("status");
  const source = url.searchParams.get("source");
  const bookId = url.searchParams.get("bookId");
  const search = url.searchParams.get("search");
  const sort = url.searchParams.get("sort") || "lastActiveAt";
  const order = url.searchParams.get("order") || "desc";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const where: Prisma.ReaderWhereInput = {
    authorId: author.id,
  };

  if (status) where.status = status as Prisma.ReaderWhereInput["status"];
  if (source) where.source = source as Prisma.ReaderWhereInput["source"];
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filter by book purchased
  if (bookId) {
    where.orders = {
      some: {
        bookId,
        status: { in: ["PAID", "FULFILLED"] },
      },
    };
  }

  const [readers, total] = await Promise.all([
    db.reader.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        orders: {
          where: { status: { in: ["PAID", "FULFILLED"] } },
          select: {
            id: true,
            bookId: true,
            amount: true,
            status: true,
            createdAt: true,
            book: { select: { title: true } },
            bookFormat: { select: { type: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    db.reader.count({ where }),
  ]);

  return NextResponse.json({
    readers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// POST /api/readers — manually add a reader
const createSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const author = await getAuthor();
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { email, name, notes, tags } = parsed.data;

  const reader = await upsertReader({
    authorId: author.id,
    email,
    name,
    source: "MANUAL",
  });

  // Apply optional fields
  if (notes || tags) {
    await db.reader.update({
      where: { id: reader.id },
      data: {
        ...(notes ? { notes } : {}),
        ...(tags ? { tags } : {}),
      },
    });
  }

  await recordReaderEvent({
    readerId: reader.id,
    type: "SUBSCRIBED",
    metadata: { source: "manual" } as Prisma.InputJsonValue,
  });

  return NextResponse.json({ reader }, { status: 201 });
}
