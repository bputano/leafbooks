"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

interface Section {
  id: string;
  slug: string;
  heading: string;
  order: number;
  isFree: boolean;
  wordCount: number;
}

interface TableOfContentsProps {
  sections: Section[];
  currentSlug: string;
  basePath: string;
  onNavigate: () => void;
  isPreviewMode?: boolean;
}

export function TableOfContents({
  sections,
  currentSlug,
  basePath,
  onNavigate,
  isPreviewMode = false,
}: TableOfContentsProps) {
  return (
    <nav className="h-full overflow-y-auto px-2 py-4">
      <ul className="space-y-0.5">
        {sections.map((section) => {
          const isActive = section.slug === currentSlug;
          const isLocked =
            isPreviewMode && !section.isFree && section.slug !== currentSlug;

          return (
            <li key={section.id}>
              <Link
                href={`${basePath}/${section.slug}`}
                onClick={onNavigate}
                className={`flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "spine-accent bg-paper-warm font-medium text-ink"
                    : isLocked
                      ? "text-ink-faint"
                      : "text-ink-light hover:bg-paper-warm hover:text-ink"
                }`}
              >
                <span className="flex-1 truncate">{section.heading}</span>
                {isLocked ? (
                  <Lock className="h-3 w-3 flex-shrink-0 text-ink-faint" />
                ) : (
                  !section.isFree && (
                    <Lock className="h-3 w-3 flex-shrink-0 text-ink-muted" />
                  )
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
