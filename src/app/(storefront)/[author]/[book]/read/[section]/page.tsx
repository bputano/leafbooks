import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkReaderAccess } from "@/lib/reader/reader-auth";
import {
  createPreviewToken,
  verifyPreviewToken,
} from "@/lib/reader/preview-token";
import { SectionInteractive } from "@/components/reader/section-interactive";
import { SectionShareButton } from "@/components/reader/section-share-button";
import { PreviewBanner } from "@/components/reader/preview-banner";
import { ReaderNav } from "@/components/reader/reader-nav";
import { ReadingProgress } from "@/components/reader/reading-progress";
import { Paywall } from "@/components/reader/paywall";
import type { Metadata } from "next";

interface SectionPageProps {
  params: Promise<{ author: string; book: string; section: string }>;
  searchParams: Promise<{ token?: string; preview?: string }>;
}

type AccessLevel = "full" | "preview" | "none";

export async function generateMetadata({
  params,
  searchParams,
}: SectionPageProps): Promise<Metadata> {
  const { author: authorSlug, book: bookSlug, section: sectionSlug } = await params;
  const { preview } = await searchParams;

  const author = await db.author.findUnique({ where: { slug: authorSlug } });
  if (!author) return {};

  const book = await db.book.findFirst({
    where: { authorId: author.id, slug: bookSlug, status: "PUBLISHED" },
  });
  if (!book) return {};

  const section = await db.bookSection.findFirst({
    where: { bookId: book.id, slug: sectionSlug },
  });
  if (!section) return {};

  const description = section.textContent.slice(0, 160) + "...";

  return {
    title: `${section.heading} — ${book.title} by ${author.displayName}`,
    description,
    openGraph: {
      title: `${section.heading} — ${book.title}`,
      description,
      type: "article",
    },
    robots: preview ? "noindex, nofollow" : undefined,
    other: {
      robots: "noai, noimageai",
    },
  };
}

export default async function SectionPage({
  params,
  searchParams,
}: SectionPageProps) {
  const { author: authorSlug, book: bookSlug, section: sectionSlug } = await params;
  const { token, preview } = await searchParams;

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
        },
      },
    },
  });
  if (!book) notFound();

  const section = await db.bookSection.findFirst({
    where: { bookId: book.id, slug: sectionSlug },
    include: {
      faqs: {
        where: { isApproved: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!section) notFound();

  const sectionIndex = book.sections.findIndex((s) => s.slug === sectionSlug);
  const prevSection = sectionIndex > 0 ? book.sections[sectionIndex - 1] : null;
  const nextSection =
    sectionIndex < book.sections.length - 1
      ? book.sections[sectionIndex + 1]
      : null;

  // Determine access level
  let accessLevel: AccessLevel = "none";
  let buyerEmail: string | null = null;
  const session = await auth();

  if (section.isFree) {
    accessLevel = "full";
    buyerEmail = session?.user?.email ?? null;
  } else {
    const isAuthor = session?.user?.id === author.userId;

    if (isAuthor) {
      accessLevel = "full";
      buyerEmail = session?.user?.email ?? null;
    } else {
      const accessResult = await checkReaderAccess(book.id, token);

      if (accessResult.hasAccess && token) {
        const sectionPath = `/${authorSlug}/${bookSlug}/read/${sectionSlug}`;
        redirect(
          `/api/reader/set-cookie?token=${encodeURIComponent(token)}&bookId=${encodeURIComponent(book.id)}&redirect=${encodeURIComponent(sectionPath)}`
        );
      }

      if (accessResult.hasAccess) {
        accessLevel = "full";
        buyerEmail = accessResult.buyerEmail ?? null;
      } else if (
        preview &&
        verifyPreviewToken(book.id, sectionSlug, preview)
      ) {
        accessLevel = "preview";
      }
    }
  }

  if (accessLevel === "none") {
    return (
      <Paywall
        bookTitle={book.title}
        sectionHeading={section.heading}
        previewText={section.textContent.slice(0, 300)}
        authorSlug={authorSlug}
        bookSlug={bookSlug}
        coverImageUrl={book.coverImageUrl}
      />
    );
  }

  const basePath = `/${authorSlug}/${bookSlug}/read`;
  const sectionPath = `${basePath}/${sectionSlug}`;
  const previewToken = createPreviewToken(book.id, sectionSlug);
  const previewUrl = `${sectionPath}?preview=${previewToken}`;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: section.heading,
    position: section.order + 1,
    isPartOf: {
      "@type": "Book",
      name: book.title,
      author: {
        "@type": "Person",
        name: author.displayName,
      },
    },
    ...(section.faqs.length > 0 && {
      mainEntity: {
        "@type": "FAQPage",
        mainEntity: section.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ReadingProgress
        current={sectionIndex + 1}
        total={book.sections.length}
      />

      <article className="mx-auto max-w-[680px] px-6 py-8">
        <div className="mb-8 flex items-center gap-2">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            {section.heading}
          </h1>
          <SectionShareButton previewUrl={previewUrl} />
        </div>

        <SectionInteractive
          html={section.htmlContent}
          sectionId={section.id}
          bookId={book.id}
          buyerEmail={buyerEmail}
          sectionUrl={sectionPath}
          bookTitle={book.title}
        />

        {/* FAQs */}
        {section.faqs.length > 0 && (
          <div className="mt-12 border-t border-ink/[0.06] pt-8">
            <h2 className="mb-4 font-serif text-lg font-semibold text-ink">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {section.faqs.map((faq) => (
                <details
                  key={faq.id}
                  className="group rounded-md border border-ink/[0.08]"
                >
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink hover:bg-paper-warm">
                    {faq.question}
                  </summary>
                  <div className="border-t border-ink/[0.06] px-4 py-3 text-sm text-ink-light">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </article>

      <ReaderNav
        prevSection={
          prevSection
            ? { slug: prevSection.slug, heading: prevSection.heading }
            : null
        }
        nextSection={
          nextSection
            ? { slug: nextSection.slug, heading: nextSection.heading }
            : null
        }
        basePath={basePath}
      />

      {accessLevel === "preview" && (
        <PreviewBanner
          bookTitle={book.title}
          authorSlug={authorSlug}
          bookSlug={bookSlug}
          coverImageUrl={book.coverImageUrl}
        />
      )}
    </>
  );
}
