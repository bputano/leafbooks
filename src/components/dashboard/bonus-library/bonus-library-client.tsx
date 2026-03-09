"use client";

import { useState } from "react";
import {
  Plus,
  FileText,
  Video,
  Link as LinkIcon,
  Briefcase,
  GraduationCap,
  ClipboardList,
  CheckSquare,
  Package,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MaterialType =
  | "PDF"
  | "VIDEO"
  | "URL"
  | "SERVICE"
  | "COURSE"
  | "TEMPLATE"
  | "CHECKLIST"
  | "OTHER";

interface BonusMaterial {
  id: string;
  title: string;
  description: string | null;
  type: MaterialType;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  order: number;
}

const TYPE_OPTIONS: { value: MaterialType; label: string }[] = [
  { value: "PDF", label: "PDF" },
  { value: "VIDEO", label: "Video" },
  { value: "URL", label: "URL / Link" },
  { value: "SERVICE", label: "Service" },
  { value: "COURSE", label: "Course" },
  { value: "TEMPLATE", label: "Template" },
  { value: "CHECKLIST", label: "Checklist" },
  { value: "OTHER", label: "Other" },
];

const TYPE_ICONS: Record<MaterialType, typeof FileText> = {
  PDF: FileText,
  VIDEO: Video,
  URL: LinkIcon,
  SERVICE: Briefcase,
  COURSE: GraduationCap,
  TEMPLATE: ClipboardList,
  CHECKLIST: CheckSquare,
  OTHER: Package,
};

interface BonusLibraryClientProps {
  initialMaterials: BonusMaterial[];
}

export function BonusLibraryClient({
  initialMaterials,
}: BonusLibraryClientProps) {
  const [materials, setMaterials] =
    useState<BonusMaterial[]>(initialMaterials);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BonusMaterial | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<MaterialType>("PDF");
  const [url, setUrl] = useState("");

  function resetForm() {
    setTitle("");
    setDescription("");
    setType("PDF");
    setUrl("");
    setEditing(null);
    setShowForm(false);
  }

  function openEdit(material: BonusMaterial) {
    setTitle(material.title);
    setDescription(material.description || "");
    setType(material.type);
    setUrl(material.url || material.fileUrl || "");
    setEditing(material);
    setShowForm(true);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);

    try {
      if (editing) {
        const res = await fetch(`/api/bonus-materials/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: description || undefined,
            type,
            url: url || undefined,
          }),
        });
        if (res.ok) {
          const { material } = await res.json();
          setMaterials((prev) =>
            prev.map((m) => (m.id === material.id ? material : m))
          );
          resetForm();
        }
      } else {
        const res = await fetch("/api/bonus-materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: description || undefined,
            type,
            url: url || undefined,
          }),
        });
        if (res.ok) {
          const { material } = await res.json();
          setMaterials((prev) => [...prev, material]);
          resetForm();
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/bonus-materials/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
  }

  return (
    <div>
      {/* Add / Edit Form */}
      {showForm && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {editing ? "Edit Material" : "Add Bonus Material"}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Strategy Workbook"
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as MaterialType)}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <Input
              label="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="mt-4 space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's included in this resource?"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Material"}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <div className="mb-6">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Material
          </Button>
        </div>
      )}

      {/* Materials grid */}
      {materials.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-gray-500">
            No bonus materials yet. Add PDFs, videos, courses, or other
            resources to bundle with your books.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => {
            const Icon = TYPE_ICONS[material.type] || Package;
            return (
              <div
                key={material.id}
                className="rounded-lg border border-gray-200 bg-white p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {material.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {TYPE_OPTIONS.find((t) => t.value === material.type)
                          ?.label || material.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(material)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {material.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                    {material.description}
                  </p>
                )}
                {(material.url || material.fileUrl) && (
                  <a
                    href={material.url || material.fileUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-leaf-600 hover:text-leaf-700"
                  >
                    <LinkIcon className="h-3 w-3" />
                    View resource
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
