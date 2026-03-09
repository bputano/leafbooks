"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GiftButton } from "@/components/reader/gift-button";
import Link from "next/link";
import { BookOpen, Library, Gift, Share2, Copy, Check } from "lucide-react";

interface EnhancedSuccessProps {
  authorSlug: string;
  bookSlug: string;
  bookTitle: string;
  coverImageUrl: string | null;
  accessToken: string | null;
  buyerEmail: string;
  buyerName: string | null;
  bookId: string;
  giftLinksEnabled: boolean;
  paymentIntentId: string;
  hasDigitalFormat: boolean;
  authorId?: string;
}

export function EnhancedSuccess({
  authorSlug,
  bookSlug,
  bookTitle,
  accessToken,
  buyerEmail,
  buyerName,
  bookId,
  giftLinksEnabled,
  paymentIntentId,
  hasDigitalFormat,
  authorId,
}: EnhancedSuccessProps) {
  const [name, setName] = useState(buyerName || "");
  const [nameSaved, setNameSaved] = useState(false);
  const [sessionCreated, setSessionCreated] = useState(false);
  const [referralUrl, setReferralUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Generate referral link
  useEffect(() => {
    async function generateReferral() {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, referrerEmail: buyerEmail }),
      });
      if (res.ok) {
        const { referral } = await res.json();
        setReferralUrl(
          `${window.location.origin}/${authorSlug}/${bookSlug}?ref=${referral.referralCode}`
        );
      }
    }
    if (buyerEmail && bookId) {
      generateReferral();
    }
  }, [buyerEmail, bookId, authorSlug, bookSlug]);

  // Auto-create session on mount
  useEffect(() => {
    async function createSession() {
      try {
        const res = await fetch("/api/reader/auth/set-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: buyerEmail, paymentIntentId }),
        });
        if (res.ok) setSessionCreated(true);
      } catch {
        // Non-critical — reader can still use per-book token
      }
    }
    if (buyerEmail && paymentIntentId) {
      createSession();
    }
  }, [buyerEmail, paymentIntentId]);

  async function saveName() {
    if (!name.trim()) return;
    try {
      await fetch("/api/reader/auth/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      setNameSaved(true);
    } catch {
      // Non-critical
    }
  }

  return (
    <div className="space-y-6">
      {/* Primary CTA: Start Reading */}
      {hasDigitalFormat && accessToken && (
        <Link
          href={`/${authorSlug}/${bookSlug}/read?token=${accessToken}`}
        >
          <Button size="lg" className="w-full">
            <BookOpen className="mr-2 h-5 w-5" />
            Start Reading Now
          </Button>
        </Link>
      )}

      {/* Gift section */}
      {giftLinksEnabled && (
        <div className="rounded-lg border border-ink/[0.08] bg-paper p-5">
          <div className="mb-3 flex items-center gap-2">
            <Gift className="h-5 w-5 text-ink-light" />
            <h3 className="font-serif text-sm font-semibold text-ink">
              Know someone who&apos;d love this?
            </h3>
          </div>
          <p className="mb-3 text-xs text-ink-muted">
            Gift a free copy of {bookTitle} to a friend.
          </p>
          <GiftButton bookId={bookId} buyerEmail={buyerEmail} />
        </div>
      )}

      {/* Referral share */}
      {referralUrl && (
        <div className="rounded-lg border border-ink/[0.08] bg-paper p-5">
          <div className="mb-3 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-ink-light" />
            <h3 className="font-serif text-sm font-semibold text-ink">
              Share with a friend
            </h3>
          </div>
          <p className="mb-3 text-xs text-ink-muted">
            Share your referral link and earn rewards when friends purchase.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={referralUrl}
              className="flex-1 rounded-md border border-ink-faint/20 bg-paper-warm/50 px-3 py-1.5 text-xs text-ink-light"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralUrl);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
              className="flex items-center gap-1 rounded-md border border-ink-faint/20 px-3 py-1.5 text-xs font-medium text-ink-light transition-colors hover:bg-paper-warm hover:text-ink"
            >
              {linkCopied ? (
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
        </div>
      )}

      {/* Library teaser */}
      {sessionCreated && (
        <Link
          href="/library"
          className="flex items-center gap-3 rounded-lg border border-ink/[0.08] bg-paper-warm/50 p-4 transition-colors hover:bg-paper-warm"
        >
          <Library className="h-5 w-5 text-ink-light" />
          <div>
            <p className="text-sm font-medium text-ink">
              Added to your Canopy Library
            </p>
            <p className="text-xs text-ink-muted">
              Access all your books, highlights, and notes in one place.
            </p>
          </div>
        </Link>
      )}

      {/* Name capture */}
      {!buyerName && (
        <div className="rounded-lg border border-ink/[0.08] bg-paper p-5">
          <p className="mb-3 text-sm text-ink-light">
            Want to add your name to your account? (Optional)
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
            <Button
              size="md"
              variant="outline"
              onClick={saveName}
              disabled={nameSaved}
            >
              {nameSaved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {/* Secondary CTAs */}
      <div className="space-y-2">
        <Link href={`/${authorSlug}/${bookSlug}`}>
          <Button variant="outline" className="w-full">
            Back to Book Page
          </Button>
        </Link>
        <Link href={`/${authorSlug}`}>
          <Button variant="ghost" className="w-full">
            Browse More Books
          </Button>
        </Link>
      </div>
    </div>
  );
}
