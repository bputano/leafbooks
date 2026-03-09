"use client";

import { useState, useEffect } from "react";
import { Share2, Gift, Check, Copy, Users, ChevronDown, ChevronUp } from "lucide-react";

interface ReferralCardProps {
  bookId: string;
  authorId: string;
  buyerEmail: string;
  authorSlug: string;
  bookSlug: string;
  giftLinksEnabled?: boolean;
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
  giftLinksEnabled,
}: ReferralCardProps) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [conversions, setConversions] = useState(0);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedGift, setCopiedGift] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [giftUrl, setGiftUrl] = useState<string | null>(null);
  const [giftLoading, setGiftLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const progressRes = await fetch(
        `/api/referrals/progress?email=${encodeURIComponent(buyerEmail)}&authorId=${authorId}`
      );
      if (progressRes.ok) {
        const data = await progressRes.json();
        setEnabled(data.enabled);
        setConversions(data.conversions);
        setTiers(data.tiers);
      }

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

  // Show bar if referrals enabled OR gift links enabled
  if (!enabled && !giftLinksEnabled) return null;

  const referralUrl = referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${authorSlug}/${bookSlug}?ref=${referralCode}`
    : "";

  const nextTier = tiers.find((t) => !t.earned);

  function copyRefLink() {
    navigator.clipboard.writeText(referralUrl);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  }

  async function createGift() {
    setGiftLoading(true);
    try {
      const res = await fetch("/api/reader/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, buyerEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        const url = `${window.location.origin}/gift/${data.token}`;
        setGiftUrl(url);
        await navigator.clipboard.writeText(url);
        setCopiedGift(true);
        setTimeout(() => setCopiedGift(false), 2000);
      }
    } catch {}
    setGiftLoading(false);
  }

  function copyGiftLink() {
    if (!giftUrl) return;
    navigator.clipboard.writeText(giftUrl);
    setCopiedGift(true);
    setTimeout(() => setCopiedGift(false), 2000);
  }

  function rewardLabel(tier: TierInfo) {
    if (tier.rewardType === "DISCOUNT") return `${tier.discountPct}% off`;
    if (tier.rewardType === "BONUS_MATERIAL" && tier.bonusMaterial)
      return tier.bonusMaterial.title;
    return tier.customTitle || "Reward";
  }

  return (
    <div className="border-t border-ink/[0.06] bg-leaf-50/50">
      {/* Always-visible bar */}
      <div className="mx-auto max-w-5xl px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Left: action buttons */}
          <div className="flex items-center gap-2">
            {/* Refer button */}
            {enabled && referralCode && (
              <button
                onClick={copyRefLink}
                className="flex items-center gap-1.5 rounded-md border border-leaf-200 bg-white px-3 py-1.5 text-xs font-medium text-leaf-700 transition-colors hover:bg-leaf-50"
              >
                {copiedRef ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Users className="h-3.5 w-3.5" />
                    Refer a Friend
                  </>
                )}
              </button>
            )}

            {/* Gift button */}
            {giftLinksEnabled && (
              <>
                {giftUrl ? (
                  <button
                    onClick={copyGiftLink}
                    className="flex items-center gap-1.5 rounded-md border border-leaf-200 bg-white px-3 py-1.5 text-xs font-medium text-leaf-700 transition-colors hover:bg-leaf-50"
                  >
                    {copiedGift ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Gift className="h-3.5 w-3.5" />
                        Copy Gift Link
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={createGift}
                    disabled={giftLoading}
                    className="flex items-center gap-1.5 rounded-md border border-leaf-200 bg-white px-3 py-1.5 text-xs font-medium text-leaf-700 transition-colors hover:bg-leaf-50 disabled:opacity-50"
                  >
                    <Gift className="h-3.5 w-3.5" />
                    {giftLoading ? "Creating..." : "Gift a Copy"}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right: progress + expand */}
          {enabled && tiers.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink-light"
            >
              {nextTier && (
                <span>
                  {conversions}/{nextTier.referralsNeeded} toward{" "}
                  {rewardLabel(nextTier)}
                </span>
              )}
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
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Expanded: tier details + referral link */}
        {expanded && enabled && (
          <div className="mt-3 space-y-3 border-t border-leaf-100 pt-3">
            {referralCode && (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralUrl}
                  className="flex-1 rounded-md border border-ink-faint/20 bg-white px-3 py-1.5 text-xs text-ink-light"
                />
                <button
                  onClick={copyRefLink}
                  className="flex items-center gap-1 rounded-md border border-ink-faint/20 bg-white px-3 py-1.5 text-xs font-medium text-ink-light transition-colors hover:bg-paper-warm hover:text-ink"
                >
                  {copiedRef ? (
                    <>
                      <Check className="h-3 w-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              {tiers.map((tier) => (
                <div key={tier.id} className="flex items-center gap-2 text-xs">
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
                    <span className="rounded-full bg-leaf-100 px-1.5 py-0.5 text-[10px] font-medium text-leaf-700">
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
