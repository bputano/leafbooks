import Link from "next/link";
import { Lock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaywallProps {
  bookTitle: string;
  sectionHeading: string;
  previewText: string;
  authorSlug: string;
  bookSlug: string;
  coverImageUrl: string | null;
}

export function Paywall({
  bookTitle,
  sectionHeading,
  previewText,
  authorSlug,
  bookSlug,
  coverImageUrl,
}: PaywallProps) {
  return (
    <div className="mx-auto max-w-[680px] px-6 py-8">
      <h1 className="mb-6 font-serif text-2xl font-semibold tracking-tight text-ink md:text-3xl">
        {sectionHeading}
      </h1>

      {/* Blurred preview */}
      <div className="relative">
        <p className="text-ink blur-[6px] select-none">
          {previewText}...
        </p>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-paper-cool/60 to-paper-cool" />
      </div>

      {/* Paywall card */}
      <div className="mt-8 rounded-md border border-ink/[0.08] bg-paper-warm p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-paper">
          <Lock className="h-6 w-6 text-ink-muted" />
        </div>

        <h2 className="font-serif text-lg font-semibold text-ink">
          Continue reading {bookTitle}
        </h2>
        <p className="mt-2 text-sm text-ink-light">
          Purchase the Serif Edition to unlock all chapters and read online.
        </p>

        <div className="mt-6">
          <Link href={`/${authorSlug}/${bookSlug}`}>
            <Button size="lg">
              <BookOpen className="mr-2 h-5 w-5" />
              Get {bookTitle}
            </Button>
          </Link>
        </div>

        <p className="mt-4 text-xs text-ink-muted">
          Already purchased?{" "}
          <Link
            href={`/${authorSlug}/${bookSlug}`}
            className="text-ink-light hover:underline"
          >
            Check your access
          </Link>
        </p>
      </div>
    </div>
  );
}
