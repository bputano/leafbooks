"use client";

import { useState } from "react";
import {
  Highlighter,
  StickyNote,
  Copy,
  Check,
  Twitter,
} from "lucide-react";
import type { TextSelectionInfo } from "@/hooks/use-text-selection";

interface TextSelectionToolbarProps {
  selection: TextSelectionInfo;
  sectionId: string;
  bookId: string;
  buyerEmail: string;
  sectionUrl: string;
  bookTitle: string;
  onHighlight: (color: string) => void;
  onNote: () => void;
  onClear: () => void;
}

const HIGHLIGHT_COLORS = [
  { name: "yellow", bg: "bg-yellow-200", ring: "ring-yellow-400" },
  { name: "green", bg: "bg-green-200", ring: "ring-green-400" },
  { name: "blue", bg: "bg-blue-200", ring: "ring-blue-400" },
  { name: "pink", bg: "bg-pink-200", ring: "ring-pink-400" },
];

export function TextSelectionToolbar({
  selection,
  sectionId,
  bookId,
  buyerEmail,
  sectionUrl,
  bookTitle,
  onHighlight,
  onNote,
  onClear,
}: TextSelectionToolbarProps) {
  const [showColors, setShowColors] = useState(false);
  const [copied, setCopied] = useState(false);

  const top = selection.rect.top - 48;
  const left = selection.rect.left + selection.rect.width / 2;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(selection.text);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClear();
      }, 1000);
    } catch {
      // Clipboard API not available
    }
  }

  function handleShareTwitter() {
    const quote = selection.text.length > 200
      ? selection.text.slice(0, 197) + "..."
      : selection.text;
    const fullUrl = `${window.location.origin}${sectionUrl}`;
    const text = encodeURIComponent(`"${quote}" — from ${bookTitle}`);
    const url = encodeURIComponent(fullUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "width=550,height=420"
    );
    onClear();
  }

  function handleShareLinkedIn() {
    const fullUrl = `${window.location.origin}${sectionUrl}`;
    const url = encodeURIComponent(fullUrl);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      "_blank",
      "width=550,height=420"
    );
    onClear();
  }

  return (
    <div
      data-selection-toolbar
      onMouseDown={(e) => e.preventDefault()}
      className="fixed z-50 flex items-center gap-1 rounded-md border border-ink/[0.08] bg-paper-cool px-2 py-1.5 shadow-warm-md"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform: "translateX(-50%)",
      }}
    >
      {showColors ? (
        <div className="flex items-center gap-1">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => {
                onHighlight(color.name);
                setShowColors(false);
              }}
              className={`h-6 w-6 rounded-full ${color.bg} ring-2 ring-transparent hover:${color.ring} transition-all`}
              title={color.name}
            />
          ))}
        </div>
      ) : (
        <>
          <button
            onClick={() => setShowColors(true)}
            className="rounded p-1.5 text-ink-light hover:bg-paper-warm hover:text-ink"
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </button>
          <button
            onClick={onNote}
            className="rounded p-1.5 text-ink-light hover:bg-paper-warm hover:text-ink"
            title="Add note"
          >
            <StickyNote className="h-4 w-4" />
          </button>
          <button
            onClick={handleCopy}
            className="rounded p-1.5 text-ink-light hover:bg-paper-warm hover:text-ink"
            title="Copy"
          >
            {copied ? (
              <Check className="h-4 w-4 text-serif-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <div className="mx-0.5 h-5 w-px bg-ink/[0.08]" />
          <button
            onClick={handleShareTwitter}
            className="rounded p-1.5 text-ink-light hover:bg-paper-warm hover:text-ink"
            title="Share on X"
          >
            <Twitter className="h-4 w-4" />
          </button>
          <button
            onClick={handleShareLinkedIn}
            className="rounded p-1.5 text-ink-light hover:bg-paper-warm hover:text-ink"
            title="Share on LinkedIn"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
