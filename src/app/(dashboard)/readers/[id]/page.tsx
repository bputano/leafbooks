import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ReaderDetail } from "@/components/dashboard/readers/reader-detail";

export const metadata = {
  title: "Reader Detail — Canopy",
};

export default async function ReaderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const author = await getAuthor();
  const { id } = await params;

  const reader = await db.reader.findFirst({
    where: { id, authorId: author.id },
    include: {
      orders: {
        where: { status: { in: ["PAID", "FULFILLED"] } },
        include: {
          book: { select: { id: true, title: true, coverImageUrl: true } },
          bookFormat: { select: { type: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          book: { select: { title: true } },
        },
      },
    },
  });

  if (!reader) notFound();

  return <ReaderDetail reader={reader} />;
}
