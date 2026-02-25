"use client";

import { Button } from "@/components/ui/button";
import type { Book } from "@/hooks/use-title-wizard";

function resolveCoverUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Storage key — construct public URL from env
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  return publicBase ? `${publicBase}/${url}` : url;
}

interface ReviewProps {
  wizard: {
    bookData: Book;
    updateField: (field: string, value: unknown) => void;
    nextStep: () => void;
    prevStep: () => void;
  };
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function Review({ wizard }: ReviewProps) {
  const { bookData, updateField } = wizard;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review</h2>
        <p className="mt-1 text-sm text-gray-600">
          Review your book details before launching.
        </p>
      </div>

      {/* Book summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex gap-6">
          {bookData.coverImageUrl ? (
            <div className="h-48 w-32 shrink-0 overflow-hidden rounded-md bg-gray-100">
              <img
                src={resolveCoverUrl(bookData.coverImageUrl)!}
                alt="Cover"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-48 w-32 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
              No cover
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {bookData.title}
              </h3>
              {bookData.subtitle && (
                <p className="text-sm text-gray-600">{bookData.subtitle}</p>
              )}
            </div>

            {bookData.description && (
              <p className="text-sm text-gray-700 line-clamp-3">
                {bookData.description}
              </p>
            )}

            {bookData.isbn && (
              <p className="text-xs text-gray-500">ISBN: {bookData.isbn}</p>
            )}

            {bookData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {bookData.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formats summary */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-700">Formats</h3>
        <div className="space-y-2">
          {bookData.formats
            .filter((f) => f.isActive)
            .map((format) => (
              <div
                key={format.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-900">
                  {format.type === "HARDCOVER"
                    ? "Hardcover"
                    : format.type === "PAPERBACK"
                      ? "Paperback"
                      : "Ebook"}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {formatCents(format.price)}
                </span>
              </div>
            ))}
        </div>
      </div>

      {bookData.preOrderDate && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Pre-orders open{" "}
          <strong>{new Date(bookData.preOrderDate).toLocaleDateString()}</strong>
          {bookData.launchDate && (
            <> — launches <strong>{new Date(bookData.launchDate).toLocaleDateString()}</strong></>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={wizard.prevStep}>
          Back
        </Button>
        <Button onClick={wizard.nextStep}>Continue to Launch</Button>
      </div>
    </div>
  );
}
