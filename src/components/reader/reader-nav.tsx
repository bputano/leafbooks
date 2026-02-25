import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReaderNavProps {
  prevSection: { slug: string; heading: string } | null;
  nextSection: { slug: string; heading: string } | null;
  basePath: string;
}

export function ReaderNav({
  prevSection,
  nextSection,
  basePath,
}: ReaderNavProps) {
  return (
    <nav className="mx-auto max-w-[680px] border-t border-ink/[0.06] px-6 py-6">
      <div className="flex items-stretch justify-between gap-4">
        {prevSection ? (
          <Link
            href={`${basePath}/${prevSection.slug}`}
            className="group flex flex-1 items-center gap-2 rounded-md border border-ink/[0.08] px-4 py-3 transition-colors hover:border-ink/[0.14] hover:bg-paper-warm"
          >
            <ChevronLeft className="h-4 w-4 flex-shrink-0 text-ink-muted group-hover:text-ink-light" />
            <div className="min-w-0">
              <p className="text-xs text-ink-muted">Previous</p>
              <p className="truncate font-serif text-sm font-medium text-ink">
                {prevSection.heading}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {nextSection ? (
          <Link
            href={`${basePath}/${nextSection.slug}`}
            className="group flex flex-1 items-center justify-end gap-2 rounded-md border border-ink/[0.08] px-4 py-3 text-right transition-colors hover:border-ink/[0.14] hover:bg-paper-warm"
          >
            <div className="min-w-0">
              <p className="text-xs text-ink-muted">Next</p>
              <p className="truncate font-serif text-sm font-medium text-ink">
                {nextSection.heading}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-muted group-hover:text-ink-light" />
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </nav>
  );
}
