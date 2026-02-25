"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewBannerProps {
  bookTitle: string;
  authorSlug: string;
  bookSlug: string;
  coverImageUrl: string | null;
}

export function PreviewBanner({
  bookTitle,
  authorSlug,
  bookSlug,
  coverImageUrl,
}: PreviewBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink/[0.08] bg-paper-cool shadow-[0_-4px_12px_rgba(44,40,37,0.06)]">
      <div className="mx-auto flex max-w-[680px] items-center gap-4 px-6 py-4">
        {coverImageUrl && (
          <img
            src={coverImageUrl}
            alt={bookTitle}
            className="h-12 w-9 flex-shrink-0 rounded-sm object-cover shadow-warm-sm"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink">
            Enjoying this preview?
          </p>
          <p className="text-xs text-ink-muted truncate">
            Get the full {bookTitle} Serif Edition
          </p>
        </div>
        <Link href={`/${authorSlug}/${bookSlug}`}>
          <Button size="sm">
            <BookOpen className="mr-1.5 h-4 w-4" />
            Get the book
          </Button>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 rounded-md p-1 text-ink-muted hover:bg-paper-warm hover:text-ink-light"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
