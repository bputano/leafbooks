"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Package,
  Check,
  BookOpen,
  FileText,
  Video,
  Link as LinkIcon,
  Briefcase,
  GraduationCap,
  ClipboardList,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BundleItem {
  id: string;
  bookFormatId: string | null;
  bonusMaterialId: string | null;
  bookFormat: {
    id: string;
    type: string;
    price: number;
  } | null;
  bonusMaterial: {
    id: string;
    title: string;
    type: string;
  } | null;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  items: BundleItem[];
}

interface BonusMaterial {
  id: string;
  title: string;
  type: string;
}

interface Format {
  id: string;
  type: string;
  price: number;
  isActive: boolean;
}

const FORMAT_LABELS: Record<string, string> = {
  HARDCOVER: "Hardcover",
  PAPERBACK: "Paperback",
  EBOOK: "Ebook",
  LEAF_EDITION: "Canopy Edition",
};

const BONUS_ICONS: Record<string, typeof FileText> = {
  PDF: FileText,
  VIDEO: Video,
  URL: LinkIcon,
  SERVICE: Briefcase,
  COURSE: GraduationCap,
  TEMPLATE: ClipboardList,
  CHECKLIST: CheckSquare,
  OTHER: Package,
};

interface BundlesProps {
  wizard: {
    bookData: {
      id: string;
      formats: Format[];
    };
    nextStep: () => void;
    prevStep: () => void;
  };
}

export function Bundles({ wizard }: BundlesProps) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [bonusMaterials, setBonusMaterials] = useState<BonusMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const bookId = wizard.bookData.id;
  const activeFormats = wizard.bookData.formats.filter((f) => f.isActive);

  useEffect(() => {
    async function load() {
      const [bundlesRes, materialsRes] = await Promise.all([
        fetch(`/api/books/${bookId}/bundles`),
        fetch("/api/bonus-materials"),
      ]);
      if (bundlesRes.ok) {
        const { bundles: b } = await bundlesRes.json();
        setBundles(b);
      }
      if (materialsRes.ok) {
        const { materials } = await materialsRes.json();
        setBonusMaterials(materials);
      }
      setLoading(false);
    }
    load();
  }, [bookId]);

  async function addBundle() {
    setSaving("new");
    const res = await fetch(`/api/books/${bookId}/bundles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Bundle",
        price: 0,
        items: [],
      }),
    });
    if (res.ok) {
      const { bundle } = await res.json();
      setBundles((prev) => [...prev, bundle]);
    }
    setSaving(null);
  }

  async function updateBundle(
    bundleId: string,
    data: Partial<{ name: string; description: string; price: number; items: { bookFormatId?: string; bonusMaterialId?: string }[] }>
  ) {
    setSaving(bundleId);
    const res = await fetch(`/api/books/${bookId}/bundles/${bundleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const { bundle } = await res.json();
      setBundles((prev) => prev.map((b) => (b.id === bundle.id ? bundle : b)));
    }
    setSaving(null);
  }

  async function deleteBundle(bundleId: string) {
    const res = await fetch(`/api/books/${bookId}/bundles/${bundleId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setBundles((prev) => prev.filter((b) => b.id !== bundleId));
    }
  }

  function toggleItem(
    bundle: Bundle,
    type: "format" | "bonus",
    itemId: string
  ) {
    const currentItems = bundle.items.map((i) => ({
      bookFormatId: i.bookFormatId || undefined,
      bonusMaterialId: i.bonusMaterialId || undefined,
    }));

    let newItems;
    if (type === "format") {
      const exists = currentItems.some((i) => i.bookFormatId === itemId);
      if (exists) {
        newItems = currentItems.filter((i) => i.bookFormatId !== itemId);
      } else {
        newItems = [...currentItems, { bookFormatId: itemId }];
      }
    } else {
      const exists = currentItems.some((i) => i.bonusMaterialId === itemId);
      if (exists) {
        newItems = currentItems.filter((i) => i.bonusMaterialId !== itemId);
      } else {
        newItems = [...currentItems, { bonusMaterialId: itemId }];
      }
    }

    updateBundle(bundle.id, { items: newItems });
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading bundles...</div>;
  }

  return (
    <div>
      <div className="mb-2">
        <h2 className="text-xl font-bold text-gray-900">Create Bundles</h2>
        <p className="mt-1 text-sm text-gray-600">
          Bundle formats and bonus materials together to increase your revenue
          per reader. Bundles appear alongside individual formats on your book
          page.
        </p>
      </div>

      {bundles.length === 0 && (
        <div className="mt-8 rounded-lg bg-gray-50 p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-gray-500">
            No bundles yet. Create a bundle to offer multiple formats and bonus
            materials together at a special price.
          </p>
          <div className="mt-4">
            <Button onClick={addBundle} disabled={saving === "new"}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create Bundle
            </Button>
          </div>
        </div>
      )}

      {bundles.length > 0 && (
        <div className="mt-6 space-y-6">
          {bundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              formats={activeFormats}
              bonusMaterials={bonusMaterials}
              saving={saving === bundle.id}
              onUpdate={(data) => updateBundle(bundle.id, data)}
              onDelete={() => deleteBundle(bundle.id)}
              onToggleItem={(type, itemId) =>
                toggleItem(bundle, type, itemId)
              }
            />
          ))}

          <Button variant="outline" onClick={addBundle} disabled={saving === "new"}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Another Bundle
          </Button>
        </div>
      )}

      <div className="mt-8 flex gap-2">
        <Button variant="outline" onClick={wizard.prevStep}>
          Back
        </Button>
        <Button onClick={wizard.nextStep}>Continue</Button>
      </div>
    </div>
  );
}

function BundleCard({
  bundle,
  formats,
  bonusMaterials,
  saving,
  onUpdate,
  onDelete,
  onToggleItem,
}: {
  bundle: Bundle;
  formats: Format[];
  bonusMaterials: BonusMaterial[];
  saving: boolean;
  onUpdate: (data: Partial<{ name: string; description: string; price: number }>) => void;
  onDelete: () => void;
  onToggleItem: (type: "format" | "bonus", itemId: string) => void;
}) {
  const [name, setName] = useState(bundle.name);
  const [description, setDescription] = useState(bundle.description || "");
  const [priceStr, setPriceStr] = useState(
    (bundle.price / 100).toFixed(2)
  );

  function handleNameBlur() {
    if (name !== bundle.name) onUpdate({ name });
  }

  function handleDescBlur() {
    if (description !== (bundle.description || ""))
      onUpdate({ description });
  }

  function handlePriceBlur() {
    const cents = Math.round(parseFloat(priceStr) * 100);
    if (!isNaN(cents) && cents !== bundle.price) {
      onUpdate({ price: cents });
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Bundle Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="e.g., Complete Package"
            />
            <Input
              label="Price ($)"
              value={priceStr}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) {
                  setPriceStr(v);
                }
              }}
              onBlur={handlePriceBlur}
              placeholder="29.99"
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescBlur}
              placeholder="What's included and why it's a great deal"
            />
          </div>
        </div>
        <button
          onClick={onDelete}
          className="ml-4 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Bundle contents */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700">Bundle Contents</h4>

        {/* Formats */}
        {formats.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Book Formats
            </p>
            <div className="mt-2 space-y-1">
              {formats.map((format) => {
                const included = bundle.items.some(
                  (i) => i.bookFormatId === format.id
                );
                return (
                  <button
                    key={format.id}
                    onClick={() => onToggleItem("format", format.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      included
                        ? "bg-leaf-50 text-leaf-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border ${
                        included
                          ? "border-leaf-600 bg-leaf-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {included && <Check className="h-3 w-3" />}
                    </div>
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span>{FORMAT_LABELS[format.type] || format.type}</span>
                    <span className="ml-auto text-xs text-gray-400">
                      ${(format.price / 100).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bonus Materials */}
        {bonusMaterials.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Bonus Materials
            </p>
            <div className="mt-2 space-y-1">
              {bonusMaterials.map((material) => {
                const included = bundle.items.some(
                  (i) => i.bonusMaterialId === material.id
                );
                const Icon = BONUS_ICONS[material.type] || Package;
                return (
                  <button
                    key={material.id}
                    onClick={() => onToggleItem("bonus", material.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      included
                        ? "bg-leaf-50 text-leaf-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border ${
                        included
                          ? "border-leaf-600 bg-leaf-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {included && <Check className="h-3 w-3" />}
                    </div>
                    <Icon className="h-4 w-4 text-gray-400" />
                    <span>{material.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {formats.length === 0 && bonusMaterials.length === 0 && (
          <p className="mt-3 text-sm text-gray-400">
            Add formats in the previous step and bonus materials in the Bonus
            Library to include them here.
          </p>
        )}

        {saving && (
          <p className="mt-2 text-xs text-gray-400">Saving...</p>
        )}
      </div>
    </div>
  );
}
