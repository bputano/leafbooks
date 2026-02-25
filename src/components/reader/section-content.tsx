"use client";

import { memo, useEffect, useRef } from "react";

interface SectionContentProps {
  html: string;
  sectionId: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export const SectionContent = memo(function SectionContent({ html, sectionId }: SectionContentProps) {
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

      const anchor = document.createElement("a");
      anchor.href = `#${id}`;
      anchor.dataset.headingAnchor = "";
      anchor.className =
        "ml-2 inline-flex opacity-0 group-hover/heading:opacity-100 hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity";
      anchor.innerHTML =
        '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
      anchor.setAttribute("aria-label", `Link to ${text}`);
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        history.replaceState(null, "", `#${id}`);
        heading.scrollIntoView({ behavior: "smooth" });
      });

      heading.classList.add("group/heading");
      heading.appendChild(anchor);
    });
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="reader-prose"
      data-section-id={sectionId}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
