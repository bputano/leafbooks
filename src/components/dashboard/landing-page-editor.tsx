"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Save,
  BookOpen,
  Check,
} from "lucide-react";

interface BookData {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  coverImageUrl: string | null;
  slug: string;
  isbn: string | null;
  keywords: string[];
  status: string;
  authorSlug: string;
  authorName: string;
  authorBio: string | null;
  authorAvatarUrl: string | null;
  hasFreeSections: boolean;
  formats: {
    id: string;
    type: string;
    price: number;
    isActive: boolean;
  }[];
}

const FORMAT_LABELS: Record<string, string> = {
  HARDCOVER: "Hardcover",
  PAPERBACK: "Paperback",
  EBOOK: "Ebook",
  LEAF_EDITION: "Canopy Edition",
};

export function LandingPageEditor({ book }: { book: BookData }) {
  const router = useRouter();
  const [title, setTitle] = useState(book.title);
  const [subtitle, setSubtitle] = useState(book.subtitle || "");
  const [description, setDescription] = useState(book.description || "");
  const [keywords, setKeywords] = useState(book.keywords.join(", "));
  const [isbn, setIsbn] = useState(book.isbn || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pageUrl = `/${book.authorSlug}/${book.slug}`;

  // Auto-save with debounce
  const scheduleAutoSave = useCallback(
    (updates: Record<string, unknown>) => {
      setDirty(true);
      setSaved(false);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch(`/api/books/${book.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
          setSaved(true);
          setDirty(false);
          setTimeout(() => setSaved(false), 2000);
        } finally {
          setSaving(false);
        }
      }, 1500);
    },
    [book.id]
  );

  function updateTitle(val: string) {
    setTitle(val);
    scheduleAutoSave({ title: val });
  }

  function updateSubtitle(val: string) {
    setSubtitle(val);
    scheduleAutoSave({ subtitle: val || null });
  }

  function updateDescription(val: string) {
    setDescription(val);
    scheduleAutoSave({ description: val || null });
  }

  function updateKeywords(val: string) {
    setKeywords(val);
    const parsed = val
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    scheduleAutoSave({ keywords: parsed });
  }

  function updateIsbn(val: string) {
    setIsbn(val);
    scheduleAutoSave({ isbn: val || null });
  }

  // Lowest price for display
  const lowestPrice = Math.min(...book.formats.map((f) => f.price));

  return (
    <div className="-mx-6 -my-8">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/titles/${book.id}/edit`)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              Edit Landing Page
            </h1>
            <p className="text-xs text-gray-500">{book.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-xs text-gray-400">Saving...</span>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          {dirty && !saving && (
            <span className="text-xs text-amber-500">Unsaved changes</span>
          )}
          {book.status === "PUBLISHED" && (
            <Link
              href={pageUrl}
              target="_blank"
              className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              View Live
            </Link>
          )}
        </div>
      </div>

      {/* Editor + Preview side by side */}
      <div className="flex min-h-[calc(100vh-57px)]">
        {/* Left: Editor form */}
        <div className="w-[400px] flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => updateTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none focus:ring-1 focus:ring-leaf-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => updateSubtitle(e.target.value)}
                placeholder="Optional subtitle"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none focus:ring-1 focus:ring-leaf-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <p className="mt-0.5 text-xs text-gray-400">
                This is the main sales copy on your book page. Line breaks are
                preserved.
              </p>
              <textarea
                value={description}
                onChange={(e) => updateDescription(e.target.value)}
                rows={10}
                placeholder="A compelling description for your sales page..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:border-leaf-500 focus:outline-none focus:ring-1 focus:ring-leaf-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                ISBN
              </label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => updateIsbn(e.target.value)}
                placeholder="978-0-000-00000-0"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none focus:ring-1 focus:ring-leaf-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Keywords
              </label>
              <p className="mt-0.5 text-xs text-gray-400">
                Shown as tags on your page. Comma-separated.
              </p>
              <input
                type="text"
                value={keywords}
                onChange={(e) => updateKeywords(e.target.value)}
                placeholder="writing, startups, leadership"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none focus:ring-1 focus:ring-leaf-500"
              />
            </div>

            <hr className="border-gray-200" />

            <div>
              <h3 className="text-sm font-medium text-gray-700">
                Cover Image
              </h3>
              <p className="mt-0.5 text-xs text-gray-400">
                To change your cover, go to{" "}
                <Link
                  href={`/titles/${book.id}/edit?step=2`}
                  className="text-leaf-600 underline"
                >
                  Upload Files
                </Link>{" "}
                in the title wizard.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700">
                Formats &amp; Pricing
              </h3>
              <p className="mt-0.5 text-xs text-gray-400">
                To change formats or prices, go to{" "}
                <Link
                  href={`/titles/${book.id}/edit?step=4`}
                  className="text-leaf-600 underline"
                >
                  Set up Formats
                </Link>{" "}
                in the title wizard.
              </p>
              <div className="mt-2 space-y-1">
                {book.formats.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm"
                  >
                    <span className="text-gray-700">
                      {FORMAT_LABELS[f.type] || f.type}
                    </span>
                    <span className="font-medium text-gray-900">
                      ${(f.price / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live preview */}
        <div className="flex-1 overflow-y-auto bg-[#faf9f7] p-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 rounded-lg border border-dashed border-gray-300 bg-white/60 px-4 py-2 text-center text-xs text-gray-400">
              Live Preview — changes appear as you type
            </div>

            {/* Preview: mirrors the storefront layout */}
            <div className="rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
              <div className="grid gap-12 md:grid-cols-[200px_1fr]">
                {/* Cover */}
                <div>
                  <div className="aspect-[2/3] overflow-hidden rounded-sm shadow-lg">
                    {book.coverImageUrl ? (
                      <img
                        src={book.coverImageUrl}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100">
                        <BookOpen className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-5">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold tracking-tight text-gray-900">
                      {title || "Book Title"}
                    </h2>
                    {subtitle && (
                      <p className="mt-1.5 font-serif text-base text-gray-500">
                        {subtitle}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-gray-400">
                      by {book.authorName}
                    </p>
                  </div>

                  {description && (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                      {description}
                    </p>
                  )}

                  {book.hasFreeSections && (
                    <div className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500">
                      <BookOpen className="h-3.5 w-3.5" />
                      Read a sample
                    </div>
                  )}

                  {/* Format pills */}
                  <div className="flex flex-wrap gap-2">
                    {book.formats.map((f, i) => (
                      <div
                        key={f.id}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                          i === 0
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {FORMAT_LABELS[f.type] || f.type} — $
                        {(f.price / 100).toFixed(2)}
                      </div>
                    ))}
                  </div>

                  {/* Buy button placeholder */}
                  <div className="rounded-md bg-gray-900 px-4 py-2.5 text-center text-sm font-medium text-white">
                    Buy Now — ${(lowestPrice / 100).toFixed(2)}
                  </div>

                  {isbn && (
                    <p className="text-xs text-gray-400">ISBN: {isbn}</p>
                  )}

                  {keywords && (
                    <div className="flex flex-wrap gap-1.5">
                      {keywords
                        .split(",")
                        .map((k) => k.trim())
                        .filter(Boolean)
                        .map((kw) => (
                          <span
                            key={kw}
                            className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-400"
                          >
                            {kw}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Author section preview */}
              <div className="mt-16 border-t border-gray-100 pt-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div>
                    <h3 className="font-serif text-sm font-semibold text-gray-900">
                      About the Author
                    </h3>
                    <div className="mt-4 flex items-start gap-3">
                      {book.authorAvatarUrl ? (
                        <img
                          src={book.authorAvatarUrl}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-400">
                          {book.authorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {book.authorName}
                        </p>
                        {book.authorBio && (
                          <p className="mt-1 text-xs text-gray-500">
                            {book.authorBio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-400">
                      Email signup form appears here
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
