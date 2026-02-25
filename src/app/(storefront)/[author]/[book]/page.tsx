import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getPublicUrl } from "@/lib/storage";
import { FormatSelector } from "@/components/storefront/format-selector";
import { EmailCapture } from "@/components/storefront/email-capture";
import { BookOpen } from "lucide-react";
import type { Metadata } from "next";

function resolveCoverUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url;
  return getPublicUrl(url);
}

interface BookPageProps {
  params: Promise<{ author: string; book: string }>;
}

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const { author: authorSlug, book: bookSlug } = await params;

  const author = await db.author.findUnique({ where: { slug: authorSlug } });
  if (!author) return {};

  const book = await db.book.findFirst({
    where: { authorId: author.id, slug: bookSlug, status: "PUBLISHED" },
  });
  if (!book) return {};

  return {
    title: `${book.title} by ${author.displayName} — Serif`,
    description: book.description || `${book.title} by ${author.displayName}`,
    openGraph: {
      title: book.title,
      description: book.description || undefined,
      images: book.coverImageUrl
        ? [resolveCoverUrl(book.coverImageUrl)!]
        : undefined,
    },
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const { author: authorSlug, book: bookSlug } = await params;

  const author = await db.author.findUnique({ where: { slug: authorSlug } });
  if (!author) notFound();

  const book = await db.book.findFirst({
    where: { authorId: author.id, slug: bookSlug, status: "PUBLISHED" },
    include: {
      formats: { where: { isActive: true } },
      sections: {
        where: { isFree: true },
        take: 1,
        select: { slug: true },
      },
    },
  });
  if (!book) notFound();

  const hasFreeSections = book.sections.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="grid gap-16 md:grid-cols-[280px_1fr]">
        {/* Cover — the hero. Warm shadow gives it physical presence. */}
        <div>
          <div className="aspect-[2/3] overflow-hidden rounded-sm shadow-warm-lg">
            {book.coverImageUrl ? (
              <img
                src={resolveCoverUrl(book.coverImageUrl)!}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-paper-warm">
                <BookOpen className="h-16 w-16 text-ink-faint" />
              </div>
            )}
          </div>
        </div>

        {/* Details — editorial, restrained */}
        <div className="space-y-8">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="mt-2 font-serif text-lg text-ink-light">
                {book.subtitle}
              </p>
            )}
            <p className="mt-3 text-sm text-ink-muted">
              by{" "}
              <a
                href={`/${authorSlug}`}
                className="text-ink-light transition-colors hover:text-ink"
              >
                {author.displayName}
              </a>
            </p>
          </div>

          {book.description && (
            <div className="max-w-prose">
              <p className="whitespace-pre-line leading-relaxed text-ink-light">
                {book.description}
              </p>
            </div>
          )}

          {/* Read Sample — quiet, inviting */}
          {hasFreeSections && (
            <a
              href={`/${authorSlug}/${bookSlug}/read`}
              className="inline-flex items-center gap-2 rounded-md border border-ink-faint/20 px-4 py-2 text-sm font-medium text-ink-light transition-colors hover:bg-paper-warm hover:text-ink"
            >
              <BookOpen className="h-4 w-4" />
              Read a sample
            </a>
          )}

          {/* Format selector & buy */}
          <FormatSelector
            formats={book.formats.map((f) => ({
              id: f.id,
              type: f.type,
              price: f.price,
              currency: f.currency,
              isActive: f.isActive,
            }))}
            bookSlug={book.slug}
            authorSlug={authorSlug}
            isPreOrder={book.isPreOrder}
          />

          {book.isbn && (
            <p className="text-xs text-ink-muted">ISBN: {book.isbn}</p>
          )}

          {book.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {book.keywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-full border border-ink-faint/15 px-2.5 py-0.5 text-xs text-ink-muted"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Author bio + email capture — separated, editorial feel */}
      <div className="mt-24 border-t border-ink/[0.06] pt-12">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-lg font-semibold text-ink">
              About the Author
            </h2>
            <div className="mt-6 flex items-start gap-4">
              {author.avatarUrl ? (
                <img
                  src={author.avatarUrl}
                  alt={author.displayName}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-paper-warm font-serif text-lg font-semibold text-ink-light">
                  {author.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-ink">{author.displayName}</p>
                {author.bio && (
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-light">
                    {author.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <EmailCapture authorId={author.id} source="book_page" />
          </div>
        </div>
      </div>
    </div>
  );
}
