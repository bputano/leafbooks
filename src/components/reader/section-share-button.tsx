"use client";

import { useState } from "react";
import { ClipboardCopy, Check } from "lucide-react";

interface SectionShareButtonProps {
  previewUrl: string;
}

export function SectionShareButton({ previewUrl }: SectionShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      const fullUrl = `${window.location.origin}${previewUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-md p-1.5 text-ink-muted hover:bg-paper-warm hover:text-ink-light transition-colors"
      title={copied ? "Copied!" : "Copy share link"}
    >
      {copied ? (
        <Check className="h-4 w-4 text-serif-success" />
      ) : (
        <ClipboardCopy className="h-4 w-4" />
      )}
    </button>
  );
}
