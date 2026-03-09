import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

async function getAuthorFromSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.author.findUnique({ where: { userId: session.user.id } });
}

const updateSchema = z.object({
  referralsNeeded: z.number().int().min(1).optional(),
  rewardType: z.enum(["DISCOUNT", "BONUS_MATERIAL", "CUSTOM"]).optional(),
  discountPct: z.number().int().min(1).max(100).optional().nullable(),
  bonusMaterialId: z.string().optional().nullable(),
  customTitle: z.string().optional().nullable(),
  customDescription: z.string().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const author = await getAuthorFromSession();
  if (!author) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.referralTier.findFirst({
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

  const tier = await db.referralTier.update({
    where: { id },
    data: parsed.data,
    include: { bonusMaterial: { select: { id: true, title: true, type: true } } },
  });

  return NextResponse.json({ tier });
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

  const existing = await db.referralTier.findFirst({
    where: { id, authorId: author.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.referralTier.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
