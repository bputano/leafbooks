import Link from "next/link";
import { BookOpen } from "lucide-react";

interface BookCardProps {
  title: string;
  subtitle: string | null;
  coverImageUrl: string | null;
  slug: string;
  authorSlug: string;
  lowestPrice: number | null;
  formatCount: number;
}

export function BookCard({
  title,
  subtitle,
  coverImageUrl,
  slug,
  authorSlug,
  lowestPrice,
  formatCount,
}: BookCardProps) {
  return (
    <Link
      href={`/${authorSlug}/${slug}`}
      className="group block overflow-hidden rounded-md transition-shadow hover:shadow-warm-md"
    >
      <div className="aspect-[2/3] overflow-hidden bg-paper-warm">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-ink-faint" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif font-medium text-ink">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-ink-muted line-clamp-1">
            {subtitle}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between text-sm">
          {lowestPrice !== null && (
            <span className="font-medium text-ink">
              From ${(lowestPrice / 100).toFixed(2)}
            </span>
          )}
          <span className="text-ink-muted">
            {formatCount} format{formatCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
