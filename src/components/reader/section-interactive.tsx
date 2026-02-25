"use client";

import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { useTextSelection } from "@/hooks/use-text-selection";
import { SectionContent } from "./section-content";
import { TextSelectionToolbar } from "./text-selection-toolbar";
import { HighlightRenderer } from "./highlight-renderer";
import { NoteEditor } from "./note-editor";

interface HighlightData {
  id: string;
  startOffset: number;
  endOffset: number;
  color: string;
  selectedText: string;
}

interface SectionInteractiveProps {
  html: string;
  sectionId: string;
  bookId: string;
  buyerEmail: string | null;
  sectionUrl: string;
  bookTitle: string;
}

export function SectionInteractive({
  html,
  sectionId,
  bookId,
  buyerEmail,
  sectionUrl,
  bookTitle,
}: SectionInteractiveProps) {
  const { selection, clearSelection } = useTextSelection(sectionId);
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const [noteForSelection, setNoteForSelection] = useState<{
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);

  // Restore native browser selection after React inserts the toolbar.
  // Without this, the blue highlight disappears because the DOM update
  // collapses the native Selection object.
  // useLayoutEffect runs synchronously before the browser paints,
  // so the user never sees the selection disappear.
  useLayoutEffect(() => {
    if (!selection) return;
    const sel = window.getSelection();
    if (!sel) return;
    // Only restore if the browser lost the selection
    if (sel.isCollapsed || sel.rangeCount === 0) {
      sel.removeAllRanges();
      sel.addRange(selection.nativeRange);
    }
  }, [selection]);

  // Fetch existing highlights on mount
  useEffect(() => {
    if (!buyerEmail) return;

    async function fetchHighlights() {
      try {
        const res = await fetch(
          `/api/reader/highlights?sectionId=${encodeURIComponent(sectionId)}&buyerEmail=${encodeURIComponent(buyerEmail!)}`
        );
        if (res.ok) {
          const data = await res.json();
          setHighlights(data.highlights);
        }
      } catch {
        // Silently fail — highlights are non-critical
      }
    }

    fetchHighlights();
  }, [sectionId, buyerEmail]);

  const handleHighlight = useCallback(
    async (color: string) => {
      if (!selection || !buyerEmail) return;

      try {
        const res = await fetch("/api/reader/highlights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionId,
            bookId,
            buyerEmail,
            startOffset: selection.startOffset,
            endOffset: selection.endOffset,
            selectedText: selection.text,
            color,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setHighlights((prev) => [...prev, data.highlight]);
        }
      } catch {
        // Silently fail
      }

      clearSelection();
    },
    [selection, sectionId, bookId, buyerEmail, clearSelection]
  );

  const handleNote = useCallback(() => {
    if (!selection) return;
    setNoteForSelection({
      text: selection.text,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
    });
    clearSelection();
  }, [selection, clearSelection]);

  async function handleSaveNote(content: string) {
    if (!noteForSelection || !buyerEmail) return;

    try {
      await fetch("/api/reader/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          bookId,
          buyerEmail,
          content,
        }),
      });
    } catch {
      // Silently fail
    }

    setNoteForSelection(null);
  }

  return (
    <>
      <SectionContent html={html} sectionId={sectionId} />

      <HighlightRenderer sectionId={sectionId} highlights={highlights} />

      {selection && (
        <TextSelectionToolbar
          selection={selection}
          sectionId={sectionId}
          bookId={bookId}
          buyerEmail={buyerEmail ?? ""}
          sectionUrl={sectionUrl}
          bookTitle={bookTitle}
          onHighlight={handleHighlight}
          onNote={handleNote}
          onClear={clearSelection}
        />
      )}

      {noteForSelection && (
        <div className="mx-auto mt-4 max-w-[680px] px-6">
          <NoteEditor
            highlightText={noteForSelection.text}
            onSave={handleSaveNote}
            onCancel={() => setNoteForSelection(null)}
          />
        </div>
      )}
    </>
  );
}
