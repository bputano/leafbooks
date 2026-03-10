"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Package, Check } from "lucide-react";

interface Format {
  id: string;
  type: string;
  price: number;
  currency: string;
  isActive: boolean;
}

interface BundleProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  items: {
    formatType: string | null;
    bonusTitle: string | null;
  }[];
}

interface FormatSelectorProps {
  formats: Format[];
  bundles?: BundleProps[];
  bookSlug: string;
  authorSlug: string;
  isPreOrder: boolean;
}

const FORMAT_LABELS: Record<string, string> = {
  HARDCOVER: "Hardcover",
  PAPERBACK: "Paperback",
  EBOOK: "Ebook",
  LEAF_EDITION: "Canopy Edition",
};

export function FormatSelector({
  formats,
  bundles = [],
  bookSlug,
  authorSlug,
  isPreOrder,
}: FormatSelectorProps) {
  const activeFormats = formats.filter((f) => f.isActive);
  const [selectedId, setSelectedId] = useState(activeFormats[0]?.id);

  if (activeFormats.length === 0 && bundles.length === 0) return null;

  const selected = activeFormats.find((f) => f.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Individual formats */}
      {activeFormats.length > 0 && (
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
                <span>{FORMAT_LABELS[format.type] || format.type}</span>
                <span className="ml-2">
                  ${(format.price / 100).toFixed(2)}
                </span>
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
      )}

      {/* Bundles */}
      {bundles.length > 0 && (
        <div className="space-y-4">
          <div className="border-t border-ink/[0.06] pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-ink-muted">
              <Package className="h-4 w-4" />
              Bundles
            </div>
          </div>

          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="rounded-lg border border-ink-faint/20 p-5 transition-colors hover:border-ink-faint/40"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-ink">{bundle.name}</h3>
                  {bundle.description && (
                    <p className="mt-1 text-sm text-ink-light">
                      {bundle.description}
                    </p>
                  )}
                </div>
                <span className="text-lg font-semibold text-ink">
                  ${(bundle.price / 100).toFixed(2)}
                </span>
              </div>

              <ul className="mt-3 space-y-1">
                {bundle.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-ink-light"
                  >
                    <Check className="h-3.5 w-3.5 text-leaf-600" />
                    {item.formatType
                      ? FORMAT_LABELS[item.formatType] || item.formatType
                      : item.bonusTitle}
                  </li>
                ))}
              </ul>

              <a
                href={`/${authorSlug}/${bookSlug}/checkout?bundle=${bundle.id}`}
                className="mt-4 block"
              >
                <Button variant="outline" className="w-full">
                  {isPreOrder ? "Pre-order" : "Buy"} Bundle — $
                  {(bundle.price / 100).toFixed(2)}
                </Button>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
