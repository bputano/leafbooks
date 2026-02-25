import { notFound } from "next/navigation";
import Link from "next/link";
import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";
import { FAQReview } from "@/components/dashboard/faq-review";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Manage FAQs — LeafBooks",
};

interface FAQPageProps {
  params: Promise<{ id: string }>;
}

export default async function FAQPage({ params }: FAQPageProps) {
  const author = await getAuthor();
  const { id } = await params;

  const book = await db.book.findFirst({
    where: { id, authorId: author.id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          faqs: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!book) notFound();

  const sections = book.sections.map((s) => ({
    id: s.id,
    heading: s.heading,
    slug: s.slug,
    order: s.order,
    faqs: s.faqs.map((f) => ({
      id: f.id,
      sectionId: f.sectionId,
      question: f.question,
      answer: f.answer,
      isApproved: f.isApproved,
      isCustom: f.isCustom,
      order: f.order,
    })),
  }));

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/titles/${id}/edit`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {book.title}
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          FAQs: {book.title}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          FAQs help readers and search engines find your book. Review, edit, and
          approve the FAQs below — only approved FAQs will appear on the reader.
        </p>
      </div>

      {book.sections.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">
            No content sections found. Process your manuscript content first in
            the title editor.
          </p>
        </div>
      ) : (
        <FAQReview bookId={book.id} initialSections={sections} />
      )}
    </div>
  );
}
