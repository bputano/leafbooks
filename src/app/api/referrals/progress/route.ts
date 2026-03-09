import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Get referral progress for a reader — used in Canopy Reader and Library
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const authorId = request.nextUrl.searchParams.get("authorId");

  if (!email || !authorId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const author = await db.author.findUnique({
    where: { id: authorId },
    select: { referralEnabled: true },
  });
  if (!author || !author.referralEnabled) {
    return NextResponse.json({
      enabled: false,
      conversions: 0,
      tiers: [],
      earnedRewards: [],
    });
  }

  const conversions = await db.referral.count({
    where: {
      authorId,
      referrerEmail: email,
      status: "CONVERTED",
    },
  });

  const tiers = await db.referralTier.findMany({
    where: { authorId },
    include: { bonusMaterial: { select: { id: true, title: true, type: true } } },
    orderBy: { referralsNeeded: "asc" },
  });

  const earnedRewards = await db.referralReward.findMany({
    where: { authorId, referrerEmail: email },
    include: {
      tier: {
        include: { bonusMaterial: { select: { id: true, title: true, type: true } } },
      },
    },
  });

  return NextResponse.json({
    enabled: true,
    conversions,
    tiers: tiers.map((t) => ({
      id: t.id,
      referralsNeeded: t.referralsNeeded,
      rewardType: t.rewardType,
      discountPct: t.discountPct,
      bonusMaterial: t.bonusMaterial,
      customTitle: t.customTitle,
      customDescription: t.customDescription,
      earned: conversions >= t.referralsNeeded,
    })),
    earnedRewards: earnedRewards.map((r) => ({
      id: r.id,
      status: r.status,
      tier: r.tier,
      createdAt: r.createdAt,
    })),
  });
}
