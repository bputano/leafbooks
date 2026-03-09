import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const convertSchema = z.object({
  referralCode: z.string(),
  referredEmail: z.string().email(),
});

// Convert a referral — called on purchase when ref cookie exists
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = convertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { referralCode, referredEmail } = parsed.data;

  const referral = await db.referral.findUnique({
    where: { referralCode },
  });
  if (!referral || referral.status === "CONVERTED" || referral.status === "EXPIRED") {
    return NextResponse.json({ error: "Invalid or already used" }, { status: 400 });
  }

  // Block self-referral
  if (referral.referrerEmail === referredEmail) {
    return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
  }

  // Mark as converted
  await db.referral.update({
    where: { id: referral.id },
    data: {
      status: "CONVERTED",
      referredEmail,
      convertedAt: new Date(),
    },
  });

  // Count total conversions for this referrer across this author
  const totalConversions = await db.referral.count({
    where: {
      authorId: referral.authorId,
      referrerEmail: referral.referrerEmail,
      status: "CONVERTED",
    },
  });

  // Check if any new tier was unlocked
  const tiers = await db.referralTier.findMany({
    where: { authorId: referral.authorId },
    orderBy: { referralsNeeded: "asc" },
  });

  const existingRewards = await db.referralReward.findMany({
    where: {
      authorId: referral.authorId,
      referrerEmail: referral.referrerEmail,
    },
    select: { tierId: true },
  });
  const earnedTierIds = new Set(existingRewards.map((r) => r.tierId));

  const newRewards = [];
  for (const tier of tiers) {
    if (totalConversions >= tier.referralsNeeded && !earnedTierIds.has(tier.id)) {
      const reward = await db.referralReward.create({
        data: {
          authorId: referral.authorId,
          referrerEmail: referral.referrerEmail,
          tierId: tier.id,
        },
      });
      newRewards.push(reward);
    }
  }

  return NextResponse.json({
    converted: true,
    totalConversions,
    newRewards: newRewards.length,
  });
}
