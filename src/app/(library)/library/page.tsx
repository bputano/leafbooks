import { db } from "@/lib/db";
import { getReaderSession } from "@/lib/reader/reader-session";
import { BookCard } from "@/components/library/book-card";
import { redirect } from "next/navigation";

export default async function LibraryPage() {
  const email = await getReaderSession();
  if (!email) redirect("/library/login");

  // Get all books this reader has access to
  const accessRecords = await db.readerAccess.findMany({
    where: { buyerEmail: email },
    include: {
      book: {
        include: {
          author: { select: { displayName: true, slug: true } },
          sections: {
            orderBy: { order: "asc" },
            select: { id: true, slug: true, order: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get reading progress for all books
  const progressRecords = await db.readingProgress.findMany({
    where: { readerEmail: email },
  });
  const progressMap = new Map(
    progressRecords.map((p) => [p.bookId, p])
  );

  // Get highlight and note counts per book
  const [highlightCounts, noteCounts] = await Promise.all([
    db.highlight.groupBy({
      by: ["bookId"],
      where: { buyerEmail: email },
      _count: { id: true },
    }),
    db.note.groupBy({
      by: ["bookId"],
      where: { buyerEmail: email },
      _count: { id: true },
    }),
  ]);

  const highlightMap = new Map(
    highlightCounts.map((h) => [h.bookId, h._count.id])
  );
  const noteMap = new Map(
    noteCounts.map((n) => [n.bookId, n._count.id])
  );

  const books = accessRecords
    .filter((a) => a.book.status === "PUBLISHED")
    .map((access) => {
      const book = access.book;
      const progress = progressMap.get(book.id);
      const totalSections = book.sections.length;
      let progressPercent = 0;
      let lastSectionSlug: string | null = null;

      if (progress && totalSections > 0) {
        const sectionIndex = book.sections.findIndex(
          (s) => s.id === progress.lastSectionId
        );
        if (sectionIndex >= 0) {
          progressPercent = Math.round(
            ((sectionIndex + 1) / totalSections) * 100
          );
          lastSectionSlug = book.sections[sectionIndex].slug;
        }
      }

      return {
        id: book.id,
        title: book.title,
        authorName: book.author.displayName,
        authorSlug: book.author.slug,
        bookSlug: book.slug,
        coverImageUrl: book.coverImageUrl,
        isGift: access.isGift,
        progressPercent,
        lastSectionSlug,
        highlightCount: highlightMap.get(book.id) || 0,
        noteCount: noteMap.get(book.id) || 0,
      };
    });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-ink">
        My Books
      </h1>

      {books.length === 0 ? (
        <div className="rounded-lg border border-ink/[0.08] bg-paper p-12 text-center">
          <p className="text-ink-muted">
            No books in your library yet. Purchase a book to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>
      )}
    </div>
  );
}
