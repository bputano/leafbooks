import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    "PDF",
    "VIDEO",
    "URL",
    "SERVICE",
    "COURSE",
    "TEMPLATE",
    "CHECKLIST",
    "OTHER",
  ]),
  url: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
});

async function getAuthorFromSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.author.findUnique({ where: { userId: session.user.id } });
}

export async function GET() {
  const author = await getAuthorFromSession();
  if (!author) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const materials = await db.bonusMaterial.findMany({
    where: { authorId: author.id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ materials });
}

export async function POST(request: Request) {
  const author = await getAuthorFromSession();
  if (!author) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const count = await db.bonusMaterial.count({
    where: { authorId: author.id },
  });

  const material = await db.bonusMaterial.create({
    data: {
      authorId: author.id,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      url: parsed.data.url,
      fileUrl: parsed.data.fileUrl,
      fileName: parsed.data.fileName,
      order: count,
    },
  });

  return NextResponse.json({ material }, { status: 201 });
}
