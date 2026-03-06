"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [magicLinkUrl, setMagicLinkUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMagicLinkUrl(null);

    try {
      const res = await fetch("/api/reader/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // Dev mode: show the link directly
      setMagicLinkUrl(data.url);
    } catch {
      setError("Failed to send magic link");
    } finally {
      setLoading(false);
    }
  }

  if (magicLinkUrl) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-light">
          Your sign-in link is ready. Click below to access your library.
        </p>
        <a
          href={magicLinkUrl}
          className="block rounded-md bg-ink px-4 py-3 text-center text-sm font-medium text-paper transition-colors hover:bg-ink-light"
        >
          Sign in to Canopy
        </a>
        <p className="text-xs text-ink-muted">
          This link expires in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        label="Email address"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        error={error || undefined}
      />
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Continue with Email
      </Button>
      <p className="text-xs text-ink-muted text-center">
        We&apos;ll send you a sign-in link. No password needed.
      </p>
    </form>
  );
}
