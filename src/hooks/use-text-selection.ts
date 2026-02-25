"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface TextSelectionInfo {
  text: string;
  startOffset: number;
  endOffset: number;
  rect: DOMRect;
  nativeRange: Range;
}

export function useTextSelection(sectionId: string) {
  const [selection, setSelection] = useState<TextSelectionInfo | null>(null);
  const isMouseDownRef = useRef(false);

  const readSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      return;
    }

    const range = sel.getRangeAt(0);
    const text = sel.toString().trim();
    if (!text || text.length < 3) return;

    // Check the selection is within the reader content
    const container = document.querySelector(
      `[data-section-id="${sectionId}"]`
    );
    if (!container || !container.contains(range.commonAncestorContainer)) {
      return;
    }

    // Compute character offsets relative to the section container's text content
    const preRange = document.createRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = startOffset + text.length;

    const rect = range.getBoundingClientRect();

    setSelection({
      text,
      startOffset,
      endOffset,
      rect,
      nativeRange: range.cloneRange(),
    });
  }, [sectionId]);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const toolbar = document.querySelector("[data-selection-toolbar]");
      if (toolbar && toolbar.contains(e.target as Node)) return;

      // Clear any existing toolbar when starting a new interaction
      setSelection(null);
      isMouseDownRef.current = true;
    }

    function handleMouseUp() {
      if (!isMouseDownRef.current) return;
      isMouseDownRef.current = false;
      readSelection();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        window.getSelection()?.removeAllRanges();
        setSelection(null);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [readSelection]);

  return { selection, clearSelection };
}
