"use client";

import { useState, useEffect } from "react";
import { Share2, Gift, Check, Copy, Users } from "lucide-react";

interface ReferralCardProps {
  bookId: string;
  authorId: string;
  buyerEmail: string;
  authorSlug: string;
  bookSlug: string;
}

interface TierInfo {
  id: string;
  referralsNeeded: number;
  rewardType: string;
  discountPct: number | null;
  bonusMaterial: { title: string } | null;
  customTitle: string | null;
  earned: boolean;
}

export function ReferralCard({
  bookId,
  authorId,
  buyerEmail,
  authorSlug,
  bookSlug,
}: ReferralCardProps) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [conversions, setConversions] = useState(0);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      // Get referral progress
      const progressRes = await fetch(
        `/api/referrals/progress?email=${encodeURIComponent(buyerEmail)}&authorId=${authorId}`
      );
      if (progressRes.ok) {
        const data = await progressRes.json();
        setEnabled(data.enabled);
        setConversions(data.conversions);
        setTiers(data.tiers);
      }

      // Get or create referral code
      const codeRes = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, referrerEmail: buyerEmail }),
      });
      if (codeRes.ok) {
        const { referral } = await codeRes.json();
        setReferralCode(referral.referralCode);
      }
    }
    load();
  }, [bookId, authorId, buyerEmail]);

  if (!enabled || tiers.length === 0) return null;

  const referralUrl = referralCode
    ? `${window.location.origin}/${authorSlug}/${bookSlug}?ref=${referralCode}`
    : "";

  const nextTier = tiers.find((t) => !t.earned);
  const earnedCount = tiers.filter((t) => t.earned).length;

  function copyLink() {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function rewardLabel(tier: TierInfo) {
    if (tier.rewardType === "DISCOUNT") return `${tier.discountPct}% off`;
    if (tier.rewardType === "BONUS_MATERIAL" && tier.bonusMaterial)
      return tier.bonusMaterial.title;
    return tier.customTitle || "Reward";
  }

  return (
    <div className="border-t border-ink/[0.06] bg-paper-warm/50 px-4 py-3">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-ink-muted" />
            <span className="text-sm font-medium text-ink-light">
              Share this book
            </span>
            {nextTier && (
              <span className="text-xs text-ink-muted">
                — {conversions}/{nextTier.referralsNeeded} toward{" "}
                {rewardLabel(nextTier)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {tiers.map((t, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  t.earned ? "bg-leaf-600" : "bg-ink-faint/40"
                }`}
              />
            ))}
          </div>
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Referral link */}
            {referralCode && (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralUrl}
                  className="flex-1 rounded-md border border-ink-faint/20 bg-paper px-3 py-1.5 text-xs text-ink-light"
                />
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1 rounded-md border border-ink-faint/20 px-3 py-1.5 text-xs font-medium text-ink-light transition-colors hover:bg-paper hover:text-ink"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy Link
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tier progress */}
            <div className="space-y-1.5">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center gap-2 text-xs"
                >
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full ${
                      tier.earned
                        ? "bg-leaf-600 text-white"
                        : "border border-ink-faint/30"
                    }`}
                  >
                    {tier.earned && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <span
                    className={
                      tier.earned ? "text-ink font-medium" : "text-ink-muted"
                    }
                  >
                    {tier.referralsNeeded}{" "}
                    {tier.referralsNeeded === 1 ? "referral" : "referrals"}:{" "}
                    {rewardLabel(tier)}
                  </span>
                  {tier.earned && (
                    <span className="rounded-full bg-leaf-50 px-1.5 py-0.5 text-[10px] font-medium text-leaf-700">
                      Earned
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
