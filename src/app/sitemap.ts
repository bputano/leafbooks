import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Get all published books with their free sections
  const books = await db.book.findMany({
    where: { status: "PUBLISHED" },
    include: {
      author: { select: { slug: true } },
      sections: {
        where: { isFree: true },
        orderBy: { order: "asc" },
        select: { slug: true, updatedAt: true },
      },
    },
  });

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  for (const book of books) {
    // Book landing page
    entries.push({
      url: `${baseUrl}/${book.author.slug}/${book.slug}`,
      lastModified: book.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });

    // Free sections (SEO-indexed)
    for (const section of book.sections) {
      entries.push({
        url: `${baseUrl}/${book.author.slug}/${book.slug}/read/${section.slug}`,
        lastModified: section.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  // Author pages
  const authors = await db.author.findMany({
    where: {
      books: { some: { status: "PUBLISHED" } },
    },
    select: { slug: true, updatedAt: true },
  });

  for (const author of authors) {
    entries.push({
      url: `${baseUrl}/${author.slug}`,
      lastModified: author.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
