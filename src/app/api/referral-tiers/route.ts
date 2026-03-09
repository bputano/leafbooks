import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

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

  const tiers = await db.referralTier.findMany({
    where: { authorId: author.id },
    include: { bonusMaterial: { select: { id: true, title: true, type: true } } },
    orderBy: { referralsNeeded: "asc" },
  });

  return NextResponse.json({ tiers, referralEnabled: author.referralEnabled });
}

const createSchema = z.object({
  referralsNeeded: z.number().int().min(1),
  rewardType: z.enum(["DISCOUNT", "BONUS_MATERIAL", "CUSTOM"]),
  discountPct: z.number().int().min(1).max(100).optional(),
  bonusMaterialId: z.string().optional(),
  customTitle: z.string().optional(),
  customDescription: z.string().optional(),
});

export async function POST(request: NextRequest) {
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

  const count = await db.referralTier.count({
    where: { authorId: author.id },
  });

  const tier = await db.referralTier.create({
    data: {
      authorId: author.id,
      ...parsed.data,
      order: count,
    },
    include: { bonusMaterial: { select: { id: true, title: true, type: true } } },
  });

  return NextResponse.json({ tier }, { status: 201 });
}
