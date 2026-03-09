"use client";

import { useState } from "react";
import { Globe, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DistributionProps {
  wizard: {
    bookData: {
      id: string;
      globalDistributionEnabled: boolean;
    };
    nextStep: () => void;
    prevStep: () => void;
    saveBook: (data: Record<string, unknown>) => Promise<void>;
    setBookData: (fn: (prev: any) => any) => void;
  };
}

const DISTRIBUTION_CHANNELS = [
  "Amazon",
  "Barnes & Noble",
  "Books-A-Million",
  "Powell's",
  "Ingram (40,000+ retailers)",
  "Libraries worldwide",
  "International bookstores (UK, EU, AU, CA, JP)",
];

export function Distribution({ wizard }: DistributionProps) {
  const [enabled, setEnabled] = useState(
    wizard.bookData.globalDistributionEnabled
  );
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const newVal = !enabled;
    setEnabled(newVal);
    setSaving(true);
    await wizard.saveBook({ globalDistributionEnabled: newVal });
    wizard.setBookData((prev: any) => ({
      ...prev,
      globalDistributionEnabled: newVal,
    }));
    setSaving(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Distribution</h2>
        <p className="mt-1 text-sm text-gray-600">
          Expand your reach beyond direct sales. Enable global distribution to
          make your book available through major retailers and libraries
          worldwide.
        </p>
      </div>

      <div
        onClick={toggle}
        className={`cursor-pointer rounded-lg border-2 p-6 transition-colors ${
          enabled
            ? "border-leaf-600 bg-leaf-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                enabled
                  ? "bg-leaf-100 text-leaf-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Lulu Global Distribution
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Your print book will be listed and available for purchase
                through major retailers and library distributors worldwide.
              </p>
            </div>
          </div>

          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              enabled
                ? "border-leaf-600 bg-leaf-600 text-white"
                : "border-gray-300"
            }`}
          >
            {enabled && <Check className="h-3.5 w-3.5" />}
          </div>
        </div>

        <div className="mt-5 ml-14">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Available through
          </p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {DISTRIBUTION_CHANNELS.map((channel) => (
              <li
                key={channel}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <span className="h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                {channel}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {enabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            Print formats (hardcover, paperback) are required for global
            distribution. Make sure you've set up at least one print format in
            the Formats step.
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={wizard.prevStep}>
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button onClick={wizard.nextStep}>
          Continue
          <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
