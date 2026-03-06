import Image from "next/image";
import Link from "next/link";
import { BookOpen, Gift, Highlighter, StickyNote } from "lucide-react";

interface BookCardProps {
  title: string;
  authorName: string;
  authorSlug: string;
  bookSlug: string;
  coverImageUrl: string | null;
  isGift: boolean;
  progressPercent: number;
  lastSectionSlug: string | null;
  highlightCount: number;
  noteCount: number;
}

export function BookCard({
  title,
  authorName,
  authorSlug,
  bookSlug,
  coverImageUrl,
  isGift,
  progressPercent,
  lastSectionSlug,
  highlightCount,
  noteCount,
}: BookCardProps) {
  const readPath = lastSectionSlug
    ? `/${authorSlug}/${bookSlug}/read/${lastSectionSlug}`
    : `/${authorSlug}/${bookSlug}/read`;

  return (
    <div className="group rounded-lg border border-ink/[0.08] bg-paper p-4 transition-shadow hover:shadow-md">
      <Link href={readPath} className="block">
        {/* Cover */}
        <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-md bg-paper-warm">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 200px"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4">
              <span className="font-serif text-sm font-medium text-ink-muted text-center">
                {title}
              </span>
            </div>
          )}

          {isGift && (
            <div className="absolute top-2 right-2 rounded-full bg-paper/90 p-1.5">
              <Gift className="h-3.5 w-3.5 text-ink-light" />
            </div>
          )}
        </div>

        {/* Info */}
        <h3 className="font-serif text-sm font-semibold text-ink line-clamp-2">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-ink-muted">by {authorName}</p>
      </Link>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-ink-muted">
            {progressPercent > 0
              ? `${progressPercent}% read`
              : "Not started"}
          </span>
          <div className="flex items-center gap-2">
            {highlightCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-ink-muted">
                <Highlighter className="h-3 w-3" />
                {highlightCount}
              </span>
            )}
            {noteCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-ink-muted">
                <StickyNote className="h-3 w-3" />
                {noteCount}
              </span>
            )}
          </div>
        </div>
        <div className="h-1 rounded-full bg-ink/[0.06]">
          <div
            className="h-1 rounded-full bg-ink/30 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <Link
        href={readPath}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-ink/[0.04] px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-ink/[0.08]"
      >
        <BookOpen className="h-3.5 w-3.5" />
        {progressPercent > 0 ? "Continue Reading" : "Start Reading"}
      </Link>
    </div>
  );
}
