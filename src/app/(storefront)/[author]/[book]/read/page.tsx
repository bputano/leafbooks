import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";

interface ReadPageProps {
  params: Promise<{ author: string; book: string }>;
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { author: authorSlug, book: bookSlug } = await params;

  const author = await db.author.findUnique({ where: { slug: authorSlug } });
  if (!author) notFound();

  const book = await db.book.findFirst({
    where: { authorId: author.id, slug: bookSlug, status: "PUBLISHED" },
    include: {
      sections: {
        orderBy: { order: "asc" },
        take: 1,
        select: { slug: true },
      },
    },
  });
  if (!book) notFound();

  const firstSection = book.sections[0];
  if (!firstSection) notFound();

  redirect(`/${authorSlug}/${bookSlug}/read/${firstSection.slug}`);
}
