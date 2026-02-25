"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, Settings, X } from "lucide-react";
import { TableOfContents } from "./table-of-contents";
import { ShareButton } from "./share-button";

interface Section {
  id: string;
  slug: string;
  heading: string;
  order: number;
  isFree: boolean;
  wordCount: number;
}

interface ReaderLayoutProps {
  bookTitle: string;
  authorName: string;
  authorSlug: string;
  bookSlug: string;
  coverImageUrl: string | null;
  sections: Section[];
  children: React.ReactNode;
}

type FontSize = "sm" | "md" | "lg";

const FONT_SIZES: Record<FontSize, string> = {
  sm: "text-sm leading-relaxed",
  md: "text-base leading-[1.75]",
  lg: "text-lg leading-[1.85]",
};

export function ReaderLayout({
  bookTitle,
  authorName,
  authorSlug,
  bookSlug,
  coverImageUrl,
  sections,
  children,
}: ReaderLayoutProps) {
  const pathname = usePathname();
  const searchParamsObj = useSearchParams();
  const isPreviewMode = searchParamsObj.has("preview");
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>("md");
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("reader-font-size") as FontSize | null;
    if (saved && saved in FONT_SIZES) {
      setFontSize(saved);
    }
    setShareUrl(window.location.href);
  }, [pathname]);

  const currentSlug = pathname.split("/read/")[1] || "";

  function changeFontSize(size: FontSize) {
    setFontSize(size);
    localStorage.setItem("reader-font-size", size);
  }

  return (
    <div className="min-h-screen bg-paper-cool">
      {/* Sticky header — quiet chrome that recedes while reading */}
      <header className="sticky top-0 z-40 border-b border-ink/[0.06] bg-paper-cool/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTocOpen(!tocOpen)}
              className="rounded-md p-2 text-ink-muted transition-colors hover:bg-paper-warm hover:text-ink-light"
              aria-label="Toggle table of contents"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <Link
                href={`/${authorSlug}/${bookSlug}`}
                className="font-serif text-sm font-medium text-ink transition-colors hover:text-ink-light"
              >
                {bookTitle}
              </Link>
              <p className="text-xs text-ink-muted">by {authorName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="rounded-md p-2 text-ink-muted transition-colors hover:bg-paper-warm hover:text-ink-light"
              aria-label="Reading settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            <ShareButton
              url={shareUrl}
              title={bookTitle}
            />
          </div>
        </div>

        {/* Settings dropdown */}
        {settingsOpen && (
          <div className="border-t border-ink/[0.06] bg-paper-cool px-4 py-3">
            <div className="mx-auto flex max-w-5xl items-center gap-4">
              <span className="text-sm text-ink-muted">Font size:</span>
              <div className="flex gap-1">
                {(["sm", "md", "lg"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => changeFontSize(size)}
                    className={`rounded-md px-3 py-1 text-sm transition-colors ${
                      fontSize === size
                        ? "bg-ink text-paper font-medium"
                        : "text-ink-muted hover:bg-paper-warm hover:text-ink-light"
                    }`}
                  >
                    {size === "sm" ? "S" : size === "md" ? "M" : "L"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="relative">
        {/* ToC sidebar — feels like a book's table of contents */}
        <aside
          className={`fixed left-0 top-[57px] z-30 h-[calc(100vh-57px)] w-72 transform border-r border-ink/[0.06] bg-paper-cool transition-transform duration-200 ${
            tocOpen ? "translate-x-0" : "-translate-x-full"
          } lg:${tocOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between border-b border-ink/[0.06] px-4 py-3 lg:hidden">
            <span className="font-serif text-sm font-medium text-ink">Contents</span>
            <button
              onClick={() => setTocOpen(false)}
              className="rounded-md p-1 text-ink-muted hover:bg-paper-warm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <TableOfContents
            sections={sections}
            currentSlug={currentSlug}
            basePath={`/${authorSlug}/${bookSlug}/read`}
            onNavigate={() => setTocOpen(false)}
            isPreviewMode={isPreviewMode}
          />
        </aside>

        {/* Overlay for mobile ToC */}
        {tocOpen && (
          <div
            className="fixed inset-0 z-20 bg-ink/10 lg:hidden"
            onClick={() => setTocOpen(false)}
          />
        )}

        {/* Main content — sacred reading space */}
        <main
          className={`reader-content font-serif ${FONT_SIZES[fontSize]} text-ink`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
