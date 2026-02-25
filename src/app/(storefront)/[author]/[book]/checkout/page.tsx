import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CheckoutForm } from "@/components/checkout/checkout-form";

interface CheckoutPageProps {
  params: Promise<{ author: string; book: string }>;
  searchParams: Promise<{ format?: string }>;
}

export const metadata = {
  title: "Checkout — LeafBooks",
};

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const { author: authorSlug, book: bookSlug } = await params;
  const { format: formatId } = await searchParams;

  const author = await db.author.findUnique({ where: { slug: authorSlug } });
  if (!author) notFound();

  const book = await db.book.findFirst({
    where: { authorId: author.id, slug: bookSlug, status: "PUBLISHED" },
    include: { formats: { where: { isActive: true } } },
  });
  if (!book) notFound();

  // Find the selected format
  const selectedFormat = formatId
    ? book.formats.find((f) => f.id === formatId)
    : book.formats[0];

  if (!selectedFormat) notFound();

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
      <p className="mt-1 text-sm text-gray-600">
        {book.title} —{" "}
        {selectedFormat.type === "HARDCOVER"
          ? "Hardcover"
          : selectedFormat.type === "PAPERBACK"
            ? "Paperback"
            : selectedFormat.type === "LEAF_EDITION"
              ? "Leaf Edition"
              : "Ebook"}
      </p>

      <div className="mt-8">
        <CheckoutForm
          bookId={book.id}
          formatId={selectedFormat.id}
          formatType={selectedFormat.type}
          price={selectedFormat.price}
          currency={selectedFormat.currency}
          bookTitle={book.title}
        />
      </div>
    </div>
  );
}
