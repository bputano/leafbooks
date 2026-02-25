"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Book } from "@/hooks/use-title-wizard";

interface TitleDetailsProps {
  wizard: {
    bookData: Book;
    updateField: (field: string, value: unknown) => void;
    nextStep: () => void;
    prevStep: () => void;
  };
}

export function TitleDetails({ wizard }: TitleDetailsProps) {
  const { bookData, updateField } = wizard;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Title Details</h2>
        <p className="mt-1 text-sm text-gray-600">
          {bookData.manuscriptFileUrl
            ? "We extracted these details from your manuscript. Edit anything that needs updating."
            : "Fill in your book's details."}
        </p>
      </div>

      {!bookData.manuscriptFileUrl && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          Upload a manuscript to auto-fill these details. You can go back to the
          previous step to upload.
        </div>
      )}

      <div className="max-w-xl space-y-5">
        <Input
          label="Title"
          name="title"
          value={bookData.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Your book title"
          required
        />

        <Input
          label="Subtitle"
          name="subtitle"
          value={bookData.subtitle || ""}
          onChange={(e) => updateField("subtitle", e.target.value)}
          placeholder="Optional subtitle"
        />

        <Textarea
          label="Description"
          name="description"
          value={bookData.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="A compelling description for your sales page..."
          rows={5}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Keywords
          </label>
          <Input
            name="keywords"
            value={bookData.keywords?.join(", ") || ""}
            onChange={(e) =>
              updateField(
                "keywords",
                e.target.value
                  .split(",")
                  .map((k) => k.trim())
                  .filter(Boolean)
              )
            }
            placeholder="leadership, productivity, self-help (comma separated)"
          />
          <p className="text-xs text-gray-500">Separate keywords with commas</p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            BISAC Codes
          </label>
          <Input
            name="bisacCodes"
            value={bookData.bisacCodes?.join(", ") || ""}
            onChange={(e) =>
              updateField(
                "bisacCodes",
                e.target.value
                  .split(",")
                  .map((c) => c.trim())
                  .filter(Boolean)
              )
            }
            placeholder="SEL027000, BUS071000 (comma separated)"
          />
          <p className="text-xs text-gray-500">
            BISAC category codes for bookstore classification
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Launch Date
          </label>
          <Input
            type="date"
            name="launchDate"
            value={
              bookData.launchDate
                ? new Date(bookData.launchDate).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) =>
              updateField("launchDate", e.target.value || null)
            }
          />
          <p className="text-xs text-gray-500">
            When your book will be available for purchase
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Pre-order Date
          </label>
          <Input
            type="date"
            name="preOrderDate"
            value={
              bookData.preOrderDate
                ? new Date(bookData.preOrderDate).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) =>
              updateField("preOrderDate", e.target.value || null)
            }
          />
          <p className="text-xs text-gray-500">
            Optional — set a date to open pre-orders before launch. Buyers will be charged immediately.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={wizard.prevStep}>
          Back
        </Button>
        <Button onClick={wizard.nextStep}>Continue</Button>
      </div>
    </div>
  );
}
