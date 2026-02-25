import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getPublicUrl } from "@/lib/storage";
import { BookOpen, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

async function getSharedContent(token: string) {
  // Check highlights first
  const highlight = await db.highlight.findUnique({
    where: { shareToken: token },
    include: {
      section: {
        include: {
          book: {
            include: { author: true },
          },
        },
      },
    },
  });

  if (highlight) {
    // Look for associated notes
    const note = await db.note.findFirst({
      where: { highlightId: highlight.id, isPublic: true },
    });

    return {
      type: "highlight" as const,
      text: highlight.selectedText,
      noteContent: note?.content || null,
      sectionHeading: highlight.section.heading,
      sectionSlug: highlight.section.slug,
      bookTitle: highlight.section.book.title,
      bookSlug: highlight.section.book.slug,
      authorName: highlight.section.book.author.displayName,
      authorSlug: highlight.section.book.author.slug,
      coverImageUrl: highlight.section.book.coverImageUrl,
    };
  }

  // Check notes
  const note = await db.note.findUnique({
    where: { shareToken: token },
    include: {
      section: {
        include: {
          book: {
            include: { author: true },
          },
        },
      },
    },
  });

  if (note) {
    return {
      type: "note" as const,
      text: note.content,
      noteContent: null,
      sectionHeading: note.section.heading,
      sectionSlug: note.section.slug,
      bookTitle: note.section.book.title,
      bookSlug: note.section.book.slug,
      authorName: note.section.book.author.displayName,
      authorSlug: note.section.book.author.slug,
      coverImageUrl: note.section.book.coverImageUrl,
    };
  }

  return null;
}

function resolveCoverUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return getPublicUrl(url);
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const content = await getSharedContent(token);
  if (!content) return {};

  const description =
    content.type === "highlight"
      ? `"${content.text.slice(0, 150)}..." — from ${content.bookTitle} by ${content.authorName}`
      : content.text.slice(0, 160);

  return {
    title: `${content.bookTitle} — Shared ${content.type === "highlight" ? "Highlight" : "Note"}`,
    description,
    openGraph: {
      title: content.bookTitle,
      description,
      images: content.coverImageUrl
        ? [resolveCoverUrl(content.coverImageUrl)!]
        : undefined,
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const content = await getSharedContent(token);

  if (!content) notFound();

  const bookUrl = `/${content.authorSlug}/${content.bookSlug}`;
  const sectionUrl = `${bookUrl}/read/${content.sectionSlug}`;

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <div className="rounded-xl border border-gray-200 bg-white p-8">
        {/* Quote/highlight */}
        <div className="mb-6">
          <Quote className="mb-3 h-8 w-8 text-leaf-300" />
          <blockquote className="text-lg font-serif leading-relaxed text-gray-800 italic">
            &ldquo;{content.text}&rdquo;
          </blockquote>
        </div>

        {/* Note if present */}
        {content.noteContent && (
          <div className="mb-6 rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-sm text-gray-700">{content.noteContent}</p>
          </div>
        )}

        {/* Book info */}
        <div className="flex items-center gap-4 border-t border-gray-100 pt-6">
          {content.coverImageUrl && (
            <div className="h-16 w-11 flex-shrink-0 overflow-hidden rounded bg-gray-100">
              <img
                src={resolveCoverUrl(content.coverImageUrl)!}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-gray-500">
              From {content.sectionHeading}
            </p>
            <Link
              href={bookUrl}
              className="font-medium text-gray-900 hover:text-leaf-600"
            >
              {content.bookTitle}
            </Link>
            <p className="text-sm text-gray-500">by {content.authorName}</p>
          </div>
        </div>

        <div className="mt-6">
          <Link href={sectionUrl}>
            <Button className="w-full">
              <BookOpen className="mr-2 h-4 w-4" />
              Read more in {content.bookTitle}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
