"use client";

import { useState } from "react";
import { Gift, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GiftButtonProps {
  bookId: string;
  buyerEmail: string;
}

export function GiftButton({ bookId, buyerEmail }: GiftButtonProps) {
  const [giftUrl, setGiftUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createGift() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reader/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, buyerEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setGiftUrl(`${window.location.origin}/gift/${data.token}`);
    } catch {
      setError("Failed to create gift link");
    } finally {
      setLoading(false);
    }
  }

  async function copyGiftLink() {
    if (!giftUrl) return;
    await navigator.clipboard.writeText(giftUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (giftUrl) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-md border border-ink/[0.08] bg-paper-warm px-3 py-2">
          <input
            readOnly
            value={giftUrl}
            className="flex-1 bg-transparent text-xs text-ink-light"
          />
          <button onClick={copyGiftLink} className="text-ink-muted hover:text-ink-light">
            {copied ? (
              <Check className="h-4 w-4 text-serif-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-ink-muted">
          Share this link to gift a free copy of the Serif Edition.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={createGift}
        loading={loading}
      >
        <Gift className="mr-1.5 h-4 w-4" />
        Gift a free copy
      </Button>
      {error && <p className="mt-1 text-xs text-serif-error">{error}</p>}
    </div>
  );
}
