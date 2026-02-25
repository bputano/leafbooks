import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AuthorHeader } from "@/components/storefront/author-header";
import { BookCard } from "@/components/storefront/book-card";
import { EmailCapture } from "@/components/storefront/email-capture";
import type { Metadata } from "next";

interface AuthorPageProps {
  params: Promise<{ author: string }>;
}

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { author: slug } = await params;
  const author = await db.author.findUnique({ where: { slug } });
  if (!author) return {};

  return {
    title: `${author.displayName} — LeafBooks`,
    description: author.bio || `Books by ${author.displayName}`,
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { author: slug } = await params;

  const author = await db.author.findUnique({
    where: { slug },
    include: {
      books: {
        where: { status: "PUBLISHED" },
        include: { formats: { where: { isActive: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!author) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <AuthorHeader
        displayName={author.displayName}
        bio={author.bio}
        avatarUrl={author.avatarUrl}
      />

      {author.books.length > 0 ? (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {author.books.map((book) => {
            const prices = book.formats.map((f) => f.price);
            const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;

            return (
              <BookCard
                key={book.id}
                title={book.title}
                subtitle={book.subtitle}
                coverImageUrl={book.coverImageUrl}
                slug={book.slug}
                authorSlug={author.slug}
                lowestPrice={lowestPrice}
                formatCount={book.formats.length}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-12 text-center text-gray-500">
          <p>No books published yet. Check back soon!</p>
        </div>
      )}

      <div className="mt-16 mx-auto max-w-md">
        <EmailCapture authorId={author.id} source="author_page" />
      </div>
    </div>
  );
}
