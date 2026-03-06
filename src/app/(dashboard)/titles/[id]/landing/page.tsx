import { notFound } from "next/navigation";
import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";
import { getPublicUrl } from "@/lib/storage";
import { LandingPageEditor } from "@/components/dashboard/landing-page-editor";

export const metadata = {
  title: "Edit Landing Page — Canopy",
};

export default async function LandingEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const author = await getAuthor();
  const { id } = await params;

  const book = await db.book.findFirst({
    where: { id, authorId: author.id },
    include: {
      formats: { where: { isActive: true } },
      sections: { where: { isFree: true }, take: 1, select: { slug: true } },
    },
  });

  if (!book) notFound();

  function resolveCover(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url;
    return getPublicUrl(url);
  }

  return (
    <LandingPageEditor
      book={{
        id: book.id,
        title: book.title,
        subtitle: book.subtitle,
        description: book.description,
        coverImageUrl: resolveCover(book.coverImageUrl),
        slug: book.slug,
        isbn: book.isbn,
        keywords: book.keywords,
        status: book.status,
        authorSlug: author.slug,
        authorName: author.displayName,
        authorBio: author.bio,
        authorAvatarUrl: author.avatarUrl,
        hasFreeSections: book.sections.length > 0,
        formats: book.formats.map((f) => ({
          id: f.id,
          type: f.type,
          price: f.price,
          isActive: f.isActive,
        })),
      }}
    />
  );
}
