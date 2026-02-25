"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Format {
  id: string;
  type: string;
  price: number;
  currency: string;
  isActive: boolean;
}

interface FormatSelectorProps {
  formats: Format[];
  bookSlug: string;
  authorSlug: string;
  isPreOrder: boolean;
}

export function FormatSelector({
  formats,
  bookSlug,
  authorSlug,
  isPreOrder,
}: FormatSelectorProps) {
  const activeFormats = formats.filter((f) => f.isActive);
  const [selectedId, setSelectedId] = useState(activeFormats[0]?.id);

  if (activeFormats.length === 0) return null;

  const selected = activeFormats.find((f) => f.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {activeFormats.map((format) => (
          <button
            key={format.id}
            onClick={() => setSelectedId(format.id)}
            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              selectedId === format.id
                ? "border-ink bg-ink text-paper"
                : "border-ink-faint/20 text-ink-light hover:border-ink-faint/40 hover:text-ink"
            }`}
          >
            <span>
              {format.type === "HARDCOVER"
                ? "Hardcover"
                : format.type === "PAPERBACK"
                  ? "Paperback"
                  : format.type === "LEAF_EDITION"
                    ? "Serif Edition"
                    : "Ebook"}
            </span>
            <span className="ml-2">${(format.price / 100).toFixed(2)}</span>
          </button>
        ))}
      </div>

      {selected && (
        <a
          href={`/${authorSlug}/${bookSlug}/checkout?format=${selected.id}`}
        >
          <Button size="lg" className="w-full">
            {isPreOrder ? "Pre-order" : "Buy Now"} — $
            {(selected.price / 100).toFixed(2)}
          </Button>
        </a>
      )}
    </div>
  );
}
