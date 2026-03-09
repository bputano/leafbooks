"use client";

import { memo, useEffect, useRef } from "react";

interface SectionContentProps {
  html: string;
  sectionId: string;
  previewUrl?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export const SectionContent = memo(function SectionContent({
  html,
  sectionId,
  previewUrl,
}: SectionContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const headings = container.querySelectorAll("h2, h3");
    headings.forEach((heading) => {
      if (heading.querySelector("[data-heading-anchor]")) return;

      const text = heading.textContent || "";
      const id = slugify(text);
      heading.id = id;

      heading.classList.add("group/heading");

      // Share button — copies a free preview link for this section
      const shareBtn = document.createElement("button");
      shareBtn.dataset.headingAnchor = "";
      shareBtn.className =
        "ml-2 inline-flex items-center gap-1 opacity-0 group-hover/heading:opacity-100 hover:opacity-100 text-ink-muted hover:text-leaf-600 transition-all text-xs font-sans";
      shareBtn.innerHTML =
        '<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' +
        '<span class="share-label">Share</span>';
      shareBtn.setAttribute("aria-label", `Share link to ${text}`);
      shareBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const url = previewUrl
          ? `${window.location.origin}${previewUrl}#${id}`
          : `${window.location.href.split("#")[0]}#${id}`;
        try {
          await navigator.clipboard.writeText(url);
          const label = shareBtn.querySelector(".share-label");
          if (label) {
            label.textContent = "Copied!";
            setTimeout(() => {
              label.textContent = "Share";
            }, 1500);
          }
        } catch {}
      });

      heading.appendChild(shareBtn);
    });
  }, [html, previewUrl]);

  return (
    <div
      ref={containerRef}
      className="reader-prose"
      data-section-id={sectionId}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
