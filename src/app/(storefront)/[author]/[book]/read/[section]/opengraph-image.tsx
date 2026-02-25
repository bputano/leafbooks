import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const runtime = "edge";
export const alt = "Book section";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ author: string; book: string; section: string }>;
}) {
  const { author: authorSlug, book: bookSlug, section: sectionSlug } = await params;

  const author = await db.author.findUnique({ where: { slug: authorSlug } });
  if (!author) return new Response("Not found", { status: 404 });

  const book = await db.book.findFirst({
    where: { authorId: author.id, slug: bookSlug },
  });
  if (!book) return new Response("Not found", { status: 404 });

  const section = await db.bookSection.findFirst({
    where: { bookId: book.id, slug: sectionSlug },
  });
  if (!section) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #f0fdf4 100%)",
          padding: "60px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "#16a34a",
            marginBottom: 16,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 600,
          }}
        >
          LeafBooks
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 48,
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.2,
            marginBottom: 20,
            maxWidth: "80%",
          }}
        >
          {section.heading}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#6b7280",
            marginBottom: 8,
          }}
        >
          {book.title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#9ca3af",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          by {author.displayName}
        </div>
      </div>
    ),
    { ...size }
  );
}
