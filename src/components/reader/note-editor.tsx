"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoteEditorProps {
  initialContent?: string;
  highlightText?: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function NoteEditor({
  initialContent = "",
  highlightText,
  onSave,
  onCancel,
  onDelete,
}: NoteEditorProps) {
  const [content, setContent] = useState(initialContent);

  return (
    <div className="rounded-md border border-ink/[0.08] bg-paper-cool p-4 shadow-warm-sm">
      {highlightText && (
        <div className="mb-3 rounded-sm bg-paper-warm px-3 py-2">
          <p className="text-xs text-ink-muted">Highlighted text:</p>
          <p className="mt-1 font-serif text-sm text-ink-light italic">
            &ldquo;{highlightText.slice(0, 200)}
            {highlightText.length > 200 ? "..." : ""}&rdquo;
          </p>
        </div>
      )}

      <textarea
        className="w-full resize-none rounded-md border border-ink/[0.08] bg-paper-warm/50 px-3 py-2 text-sm text-ink focus:border-ink-faint focus:outline-none focus:ring-1 focus:ring-ink-faint"
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your note..."
        autoFocus
      />

      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => onSave(content)}
          disabled={!content.trim()}
        >
          <Save className="mr-1 h-3.5 w-3.5" />
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="ml-auto text-xs text-serif-error hover:text-serif-error/80"
          >
            Delete note
          </button>
        )}
      </div>
    </div>
  );
}
