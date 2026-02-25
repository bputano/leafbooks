import { db } from "@/lib/db";

/**
 * Build context for AI chat by finding the most relevant sections.
 * Simple keyword-based search — finds sections containing query terms.
 */
export async function buildBookContext(
  bookId: string,
  query: string
): Promise<{ sections: { heading: string; content: string }[]; bookTitle: string }> {
  const book = await db.book.findUnique({
    where: { id: bookId },
    include: {
      sections: {
        orderBy: { order: "asc" },
        select: {
          heading: true,
          textContent: true,
          wordCount: true,
        },
      },
    },
  });

  if (!book || book.sections.length === 0) {
    return { sections: [], bookTitle: "" };
  }

  // Simple relevance scoring: count how many query terms appear in each section
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scored = book.sections.map((section) => {
    const text = section.textContent.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      const matches = text.split(term).length - 1;
      score += matches;
    }
    return { ...section, score };
  });

  // Sort by relevance, take top 5
  scored.sort((a, b) => b.score - a.score);
  const topSections = scored.slice(0, 5).filter((s) => s.score > 0);

  // If no matches, return first 3 sections as context
  const contextSections =
    topSections.length > 0
      ? topSections
      : scored.slice(0, 3);

  return {
    bookTitle: book.title,
    sections: contextSections.map((s) => ({
      heading: s.heading,
      // Truncate long sections to stay within context limits
      content: s.textContent.slice(0, 5000),
    })),
  };
}
