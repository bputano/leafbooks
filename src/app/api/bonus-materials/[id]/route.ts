import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z
    .enum([
      "PDF",
      "VIDEO",
      "URL",
      "SERVICE",
      "COURSE",
      "TEMPLATE",
      "CHECKLIST",
      "OTHER",
    ])
    .optional(),
  url: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
});

async function getAuthorFromSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.author.findUnique({ where: { userId: session.user.id } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const author = await getAuthorFromSession();
  if (!author) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.bonusMaterial.findFirst({
    where: { id, authorId: author.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const material = await db.bonusMaterial.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ material });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const author = await getAuthorFromSession();
  if (!author) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.bonusMaterial.findFirst({
    where: { id, authorId: author.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.bonusMaterial.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
