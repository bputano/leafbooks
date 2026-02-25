"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLATFORM_FEES } from "@/config/pricing";
import type { Book, Format } from "@/hooks/use-title-wizard";

interface SetupFormatsProps {
  wizard: {
    bookData: Book;
    setBookData: (fn: (prev: Book) => Book) => void;
    nextStep: () => void;
    prevStep: () => void;
  };
}

const FORMAT_OPTIONS = [
  { type: "HARDCOVER" as const, label: "Hardcover" },
  { type: "PAPERBACK" as const, label: "Paperback" },
  { type: "EBOOK" as const, label: "Ebook" },
  { type: "LEAF_EDITION" as const, label: "Leaf Edition" },
];

const TRIM_SIZES = [
  "5x8",
  "5.25x8",
  "5.5x8.5",
  "6x9",
  "7x10",
  "8x10",
  "8.5x11",
];
const PAPER_TYPES = ["cream", "white", "bright_white"];
const BINDING_TYPES = ["perfect_bound", "hardcover_casewrap", "hardcover_dustjacket"];
const INTERIOR_COLORS = ["bw", "color"];
const COVER_FINISHES = ["glossy", "matte"];

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function FormatCard({
  format,
  bookId,
  onUpdate,
  onDelete,
}: {
  format: Format;
  bookId: string;
  onUpdate: (updated: Format) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [saving, setSaving] = useState(false);
  const isPrint = format.type !== "EBOOK" && format.type !== "LEAF_EDITION";

  const printingCost = format.printingCostCents || 0;
  // TODO: use author's actual subscription tier when available
  const feeRate = PLATFORM_FEES.FREE;
  const platformFee = Math.round(format.price * feeRate);
  const stripeFee = format.price > 0 ? Math.round(format.price * 0.029 + 30) : 0;
  const netEarnings = format.price - printingCost - platformFee - stripeFee;

  async function updateFormat(data: Partial<Format>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/books/${bookId}/formats/${format.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const { format: updated } = await res.json();
        onUpdate(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  async function fetchCostEstimate() {
    if (!isPrint) return;
    try {
      const res = await fetch("/api/lulu/cost-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          formatId: format.id,
          trimSize: format.trimSize,
          bindingType: format.bindingType,
          paperType: format.paperType,
          interiorColor: format.interiorColor,
          pageCount: format.pageCount,
          coverFinish: format.coverFinish,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        updateFormat({
          printingCostCents: data.printingCostCents,
          shippingEstimateCents: data.shippingEstimateCents,
        });
      }
    } catch {
      // Cost estimate is non-critical
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900">
            {format.type === "HARDCOVER"
              ? "Hardcover"
              : format.type === "PAPERBACK"
                ? "Paperback"
                : format.type === "LEAF_EDITION"
                  ? "Leaf Edition"
                  : "Ebook"}
          </h3>
          {saving && <span className="text-xs text-gray-400">Saving...</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            {formatCents(format.price)}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-5 border-t border-gray-100 p-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (USD)"
              type="number"
              step="0.01"
              min="0"
              value={(format.price / 100).toFixed(2)}
              onChange={(e) => {
                const cents = Math.round(parseFloat(e.target.value || "0") * 100);
                onUpdate({ ...format, price: cents });
                updateFormat({ price: cents });
              }}
            />
            {isPrint && (
              <Input
                label="Page Count"
                type="number"
                min="1"
                value={format.pageCount || ""}
                onChange={(e) => {
                  const count = parseInt(e.target.value) || undefined;
                  onUpdate({ ...format, pageCount: count || null });
                  updateFormat({ pageCount: count });
                }}
              />
            )}
          </div>

          {isPrint && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Trim Size
                </label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={format.trimSize || ""}
                  onChange={(e) => {
                    onUpdate({ ...format, trimSize: e.target.value });
                    updateFormat({ trimSize: e.target.value });
                  }}
                >
                  <option value="">Select...</option>
                  {TRIM_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Paper Type
                </label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={format.paperType || ""}
                  onChange={(e) => {
                    onUpdate({ ...format, paperType: e.target.value });
                    updateFormat({ paperType: e.target.value });
                  }}
                >
                  <option value="">Select...</option>
                  {PAPER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Binding
                </label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={format.bindingType || ""}
                  onChange={(e) => {
                    onUpdate({ ...format, bindingType: e.target.value });
                    updateFormat({ bindingType: e.target.value });
                  }}
                >
                  <option value="">Select...</option>
                  {BINDING_TYPES.map((b) => (
                    <option key={b} value={b}>
                      {b.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Interior Color
                </label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={format.interiorColor || ""}
                  onChange={(e) => {
                    onUpdate({ ...format, interiorColor: e.target.value });
                    updateFormat({ interiorColor: e.target.value });
                  }}
                >
                  <option value="">Select...</option>
                  {INTERIOR_COLORS.map((c) => (
                    <option key={c} value={c}>
                      {c === "bw" ? "Black & White" : "Full Color"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Cover Finish
                </label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={format.coverFinish || ""}
                  onChange={(e) => {
                    onUpdate({ ...format, coverFinish: e.target.value });
                    updateFormat({ coverFinish: e.target.value });
                  }}
                >
                  <option value="">Select...</option>
                  {COVER_FINISHES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <Input
            label="ISBN"
            value={format.isbn || ""}
            onChange={(e) => {
              onUpdate({ ...format, isbn: e.target.value || null });
              updateFormat({ isbn: e.target.value || null });
            }}
            placeholder="978-0-000-00000-0"
          />

          {isPrint && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchCostEstimate}>
                Get Print Cost Estimate
              </Button>
            </div>
          )}

          {/* Pricing breakdown */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-medium text-gray-700">
              Earnings Breakdown
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sale price</span>
                <span>{formatCents(format.price)}</span>
              </div>
              {isPrint && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Print cost</span>
                  <span className="text-red-600">
                    -{formatCents(printingCost)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Platform fee (20%)</span>
                <span className="text-red-600">-{formatCents(platformFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing fee (~2.9% + $0.30)</span>
                <span className="text-red-600">-{formatCents(stripeFee)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1 font-medium">
                <span>Your earnings</span>
                <span className={netEarnings >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCents(Math.max(0, netEarnings))}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove format
          </button>
        </div>
      )}
    </div>
  );
}

export function SetupFormats({ wizard }: SetupFormatsProps) {
  const { bookData } = wizard;
  const [adding, setAdding] = useState(false);

  const existingTypes = bookData.formats.map((f) => f.type);
  const availableTypes = FORMAT_OPTIONS.filter(
    (o) => !existingTypes.includes(o.type)
  );

  async function addFormat(type: "HARDCOVER" | "PAPERBACK" | "EBOOK" | "LEAF_EDITION") {
    setAdding(true);
    try {
      const res = await fetch(`/api/books/${bookData.id}/formats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, price: 0 }),
      });
      if (res.ok) {
        const { format } = await res.json();
        wizard.setBookData((prev) => ({
          ...prev,
          formats: [...prev.formats, format],
        }));
      }
    } finally {
      setAdding(false);
    }
  }

  async function deleteFormat(formatId: string) {
    const res = await fetch(
      `/api/books/${bookData.id}/formats/${formatId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      wizard.setBookData((prev) => ({
        ...prev,
        formats: prev.formats.filter((f) => f.id !== formatId),
      }));
    }
  }

  function updateFormatLocal(updated: Format) {
    wizard.setBookData((prev) => ({
      ...prev,
      formats: prev.formats.map((f) => (f.id === updated.id ? updated : f)),
    }));
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Set up Formats</h2>
        <p className="mt-1 text-sm text-gray-600">
          Choose which formats to offer and set prices for each.
        </p>
      </div>

      <div className="space-y-4">
        {bookData.formats.map((format) => (
          <FormatCard
            key={format.id}
            format={format}
            bookId={bookData.id}
            onUpdate={updateFormatLocal}
            onDelete={() => deleteFormat(format.id)}
          />
        ))}
      </div>

      {availableTypes.length > 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-4">
          <p className="mb-3 text-sm font-medium text-gray-700">Add a format</p>
          <div className="flex flex-wrap gap-2">
            {availableTypes.map((opt) => (
              <Button
                key={opt.type}
                variant="outline"
                size="sm"
                onClick={() => addFormat(opt.type)}
                disabled={adding}
              >
                <Plus className="mr-1 h-4 w-4" />
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {bookData.formats.length === 0 && (
        <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500">
          <p>No formats added yet. Add at least one format to continue.</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={wizard.prevStep}>
          Back
        </Button>
        <Button
          onClick={wizard.nextStep}
          disabled={bookData.formats.length === 0}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
