"use client";

import { memo, useEffect } from "react";

interface HighlightData {
  id: string;
  startOffset: number;
  endOffset: number;
  color: string;
}

interface HighlightRendererProps {
  sectionId: string;
  highlights: HighlightData[];
  onHighlightClick?: (id: string) => void;
}

const COLOR_CLASSES: Record<string, string> = {
  yellow: "bg-yellow-200/60",
  green: "bg-green-200/60",
  blue: "bg-blue-200/60",
  pink: "bg-pink-200/60",
};

export const HighlightRenderer = memo(function HighlightRenderer({
  sectionId,
  highlights,
  onHighlightClick,
}: HighlightRendererProps) {
  useEffect(() => {
    const container = document.querySelector(
      `[data-section-id="${sectionId}"]`
    );
    if (!container) return;

    // Remove existing highlight marks
    container
      .querySelectorAll("mark[data-highlight-id]")
      .forEach((el) => {
        const parent = el.parentNode;
        if (parent) {
          parent.replaceChild(
            document.createTextNode(el.textContent || ""),
            el
          );
          parent.normalize();
        }
      });

    // Sort highlights by startOffset to avoid overlapping issues
    const sorted = [...highlights].sort(
      (a, b) => a.startOffset - b.startOffset
    );

    for (const highlight of sorted) {
      applyHighlight(container, highlight, onHighlightClick);
    }
  }, [sectionId, highlights, onHighlightClick]);

  return null;
});

function applyHighlight(
  container: Element,
  highlight: HighlightData,
  onClick?: (id: string) => void
) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let currentOffset = 0;
  let node: Text | null;

  while ((node = walker.nextNode() as Text | null)) {
    const nodeLength = node.textContent?.length || 0;
    const nodeStart = currentOffset;
    const nodeEnd = currentOffset + nodeLength;

    // Check if this text node overlaps with the highlight range
    if (nodeEnd > highlight.startOffset && nodeStart < highlight.endOffset) {
      const overlapStart = Math.max(0, highlight.startOffset - nodeStart);
      const overlapEnd = Math.min(nodeLength, highlight.endOffset - nodeStart);

      const range = document.createRange();
      range.setStart(node, overlapStart);
      range.setEnd(node, overlapEnd);

      const mark = document.createElement("mark");
      mark.dataset.highlightId = highlight.id;
      mark.className = `${COLOR_CLASSES[highlight.color] || COLOR_CLASSES.yellow} rounded-sm cursor-pointer`;

      if (onClick) {
        mark.addEventListener("click", () => onClick(highlight.id));
      }

      try {
        range.surroundContents(mark);
      } catch {
        // surroundContents can fail if range spans multiple elements
        // In that case, we skip this highlight
      }
      break; // After modifying DOM, stop (offsets shift)
    }

    currentOffset += nodeLength;
  }
}
