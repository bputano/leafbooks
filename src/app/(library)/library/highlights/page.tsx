import { db } from "@/lib/db";
import { getReaderSession } from "@/lib/reader/reader-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Highlighter } from "lucide-react";

export const metadata = {
  title: "Highlights — Canopy",
};

export default async function HighlightsPage() {
  const email = await getReaderSession();
  if (!email) redirect("/library/login");

  const highlights = await db.highlight.findMany({
    where: { buyerEmail: email },
    include: {
      section: {
        select: {
          slug: true,
          heading: true,
          book: {
            select: {
              title: true,
              slug: true,
              author: { select: { slug: true, displayName: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by book
  const bookGroups = new Map<
    string,
    {
      bookTitle: string;
      authorSlug: string;
      bookSlug: string;
      highlights: typeof highlights;
    }
  >();

  for (const h of highlights) {
    const bookTitle = h.section.book.title;
    if (!bookGroups.has(bookTitle)) {
      bookGroups.set(bookTitle, {
        bookTitle,
        authorSlug: h.section.book.author.slug,
        bookSlug: h.section.book.slug,
        highlights: [],
      });
    }
    bookGroups.get(bookTitle)!.highlights.push(h);
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-ink">
        Highlights
      </h1>

      {highlights.length === 0 ? (
        <div className="rounded-lg border border-ink/[0.08] bg-paper p-12 text-center">
          <p className="text-ink-muted">
            No highlights yet. Highlight text while reading to save it here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(bookGroups.values()).map((group) => (
            <div key={group.bookTitle}>
              <h2 className="mb-3 font-serif text-lg font-semibold text-ink">
                {group.bookTitle}
              </h2>
              <div className="space-y-2">
                {group.highlights.map((h) => (
                  <Link
                    key={h.id}
                    href={`/${group.authorSlug}/${group.bookSlug}/read/${h.section.slug}`}
                    className="block rounded-md border border-ink/[0.06] bg-paper p-4 transition-colors hover:bg-paper-warm"
                  >
                    <div className="flex items-start gap-3">
                      <Highlighter
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{
                          color:
                            h.color === "yellow"
                              ? "#ca8a04"
                              : h.color === "green"
                                ? "#16a34a"
                                : h.color === "blue"
                                  ? "#2563eb"
                                  : "#ca8a04",
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-serif text-sm text-ink">
                          &ldquo;{h.selectedText}&rdquo;
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {h.section.heading}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
