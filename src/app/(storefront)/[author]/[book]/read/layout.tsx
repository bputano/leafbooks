import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ReaderLayout } from "@/components/reader/reader-layout";

interface ReaderLayoutProps {
  params: Promise<{ author: string; book: string }>;
  children: React.ReactNode;
}

export default async function ReadLayout({
  params,
  children,
}: ReaderLayoutProps) {
  const { author: authorSlug, book: bookSlug } = await params;

  const author = await db.author.findUnique({ where: { slug: authorSlug } });
  if (!author) notFound();

  const book = await db.book.findFirst({
    where: { authorId: author.id, slug: bookSlug, status: "PUBLISHED" },
    include: {
      sections: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          slug: true,
          heading: true,
          order: true,
          isFree: true,
          wordCount: true,
        },
      },
    },
  });
  if (!book) notFound();

  const sections = book.sections.map((s) => ({
    id: s.id,
    slug: s.slug,
    heading: s.heading,
    order: s.order,
    isFree: s.isFree,
    wordCount: s.wordCount,
  }));

  return (
    <ReaderLayout
      bookTitle={book.title}
      authorName={author.displayName}
      authorSlug={authorSlug}
      bookSlug={bookSlug}
      coverImageUrl={book.coverImageUrl}
      sections={sections}
    >
      {children}
    </ReaderLayout>
  );
}
