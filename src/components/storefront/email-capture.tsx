"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EmailCaptureProps {
  authorId: string;
  source: string;
}

export function EmailCapture({ authorId, source }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorId, email, source }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to subscribe");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-md bg-paper-warm p-4 text-center text-sm text-ink-light">
        You&apos;re subscribed! We&apos;ll let you know about new releases.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-medium text-ink">
        Get notified about new releases
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1"
        />
        <Button type="submit" size="md" loading={loading}>
          Subscribe
        </Button>
      </div>
      {error && <p className="text-sm text-serif-error">{error}</p>}
    </form>
  );
}
