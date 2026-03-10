"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Check, BookOpen } from "lucide-react";
import type { Book } from "@/hooks/use-title-wizard";

interface LaunchProps {
  wizard: {
    bookData: Book;
    updateField: (field: string, value: unknown) => void;
    prevStep: () => void;
  };
}

export function Launch({ wizard }: LaunchProps) {
  const { bookData, updateField } = wizard;
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(bookData.status === "PUBLISHED");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/${bookData.id}/publish`, {
        method: "POST",
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Non-JSON response from publish API:", text.slice(0, 500));
        setError("Server error — check Vercel function logs for details.");
        return;
      }

      if (!res.ok) {
        setError(data.error || "Failed to publish");
        return;
      }

      setPublished(true);
      setPublishedUrl(data.url);
    } catch (err) {
      console.error("Publish failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to publish. Check the console for details."
      );
    } finally {
      setPublishing(false);
    }
  }

  if (published) {
    return (
      <div className="space-y-8">
        <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Your page is live!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your book is now available for purchase.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2">
            {publishedUrl && (
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-leaf-600 hover:text-leaf-700"
              >
                View your page <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {bookData.authorSlug && bookData.slug && (
              <a
                href={`/${bookData.authorSlug}/${bookData.slug}/read`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-leaf-600 hover:text-leaf-700"
              >
                Open in Canopy Reader <BookOpen className="h-4 w-4" />
              </a>
            )}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Content processing may take a moment before the reader is ready.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push("/titles")}
        >
          Back to Titles
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Launch</h2>
        <p className="mt-1 text-sm text-gray-600">
          Set your URL slug and publish your book.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="max-w-md space-y-4">
        <div className="space-y-1">
          <Input
            label="URL Slug"
            value={bookData.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            placeholder="your-book-title"
          />
          <p className="text-xs text-gray-500">
            Your book will be available at its unique URL after publishing.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Note:</strong> To accept paid orders, connect your Stripe
        account in{" "}
        <a
          href="/settings/payments"
          className="font-medium underline"
        >
          Settings &rarr; Payments
        </a>
        . You can publish now and connect Stripe later.
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={wizard.prevStep}>
          Back
        </Button>
        <Button onClick={handlePublish} loading={publishing}>
          {bookData.isPreOrder ? "Open Pre-orders" : "Publish Now"}
        </Button>
      </div>
    </div>
  );
}
