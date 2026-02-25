"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Gift, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GiftRedemptionPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState(false);
  const [readerUrl, setReaderUrl] = useState<string | null>(null);

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reader/gift/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setRedeemed(true);
      setReaderUrl(data.readerUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (redeemed && readerUrl) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <BookOpen className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Gift Redeemed!</h1>
        <p className="mt-2 text-gray-600">
          You now have access to the Leaf Edition. Start reading now.
        </p>
        <div className="mt-6">
          <Button size="lg" onClick={() => router.push(readerUrl)}>
            Start Reading
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-leaf-100">
        <Gift className="h-8 w-8 text-leaf-600" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        You&apos;ve been gifted a book!
      </h1>
      <p className="mt-2 text-gray-600">
        Enter your email to claim your free Leaf Edition access.
      </p>

      <form onSubmit={handleRedeem} className="mt-8 space-y-4">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" loading={loading}>
          Claim Your Gift
        </Button>
      </form>
    </div>
  );
}
