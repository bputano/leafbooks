import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";
import { ReferralsClient } from "@/components/dashboard/grow/referrals-client";

export const metadata = {
  title: "Referrals — Grow — Canopy",
};

export default async function ReferralsPage() {
  const author = await getAuthor();

  const [referrals, tiers, bonusMaterials] = await Promise.all([
    db.referral.findMany({
      where: { authorId: author.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { book: { select: { title: true } } },
    }),
    db.referralTier.findMany({
      where: { authorId: author.id },
      include: {
        bonusMaterial: { select: { id: true, title: true, type: true } },
      },
      orderBy: { referralsNeeded: "asc" },
    }),
    db.bonusMaterial.findMany({
      where: { authorId: author.id },
      select: { id: true, title: true, type: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const totalClicks = referrals.reduce((sum, r) => sum + r.clickCount, 0);
  const totalConverted = referrals.filter(
    (r) => r.status === "CONVERTED"
  ).length;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Reader Referral Program
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Reward readers who share your books. Configure reward tiers and track
          referral activity.
        </p>
      </div>

      <ReferralsClient
        initialReferralEnabled={author.referralEnabled}
        initialTiers={tiers.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
        }))}
        initialReferrals={referrals.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          convertedAt: r.convertedAt?.toISOString() || null,
        }))}
        bonusMaterials={bonusMaterials}
        stats={{
          totalReferrals: referrals.length,
          totalClicks,
          totalConverted,
          conversionRate:
            totalClicks > 0
              ? Math.round((totalConverted / totalClicks) * 100)
              : 0,
        }}
      />
    </div>
  );
}
