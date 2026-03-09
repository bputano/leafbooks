import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CheckoutForm } from "@/components/checkout/checkout-form";

interface CheckoutPageProps {
  params: Promise<{ author: string; book: string }>;
  searchParams: Promise<{ format?: string; bundle?: string }>;
}

export const metadata = {
  title: "Checkout — Canopy",
};

const FORMAT_LABELS: Record<string, string> = {
  HARDCOVER: "Hardcover",
  PAPERBACK: "Paperback",
  EBOOK: "Ebook",
  LEAF_EDITION: "Leaf Edition",
};

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const { author: authorSlug, book: bookSlug } = await params;
  const { format: formatId, bundle: bundleId } = await searchParams;

  const author = await db.author.findUnique({ where: { slug: authorSlug } });
  if (!author) notFound();

  const book = await db.book.findFirst({
    where: { authorId: author.id, slug: bookSlug, status: "PUBLISHED" },
    include: { formats: { where: { isActive: true } } },
  });
  if (!book) notFound();

  // Bundle checkout
  if (bundleId) {
    const bundle = await db.bundle.findFirst({
      where: { id: bundleId, bookId: book.id, isActive: true },
      include: {
        items: {
          include: {
            bookFormat: true,
            bonusMaterial: true,
          },
        },
      },
    });
    if (!bundle) notFound();

    const hasPrint = bundle.items.some(
      (i) =>
        i.bookFormat &&
        i.bookFormat.type !== "EBOOK" &&
        i.bookFormat.type !== "LEAF_EDITION"
    );

    return (
      <div className="mx-auto max-w-lg px-6 py-12">
        <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
        <p className="mt-1 text-sm text-gray-600">
          {book.title} — {bundle.name}
        </p>

        <div className="mt-8">
          <CheckoutForm
            bookId={book.id}
            formatId={bundle.items.find((i) => i.bookFormatId)?.bookFormatId || ""}
            formatType={hasPrint ? "HARDCOVER" : "EBOOK"}
            price={bundle.price}
            currency={bundle.currency}
            bookTitle={book.title}
            bundleId={bundle.id}
            bundleName={bundle.name}
          />
        </div>
      </div>
    );
  }

  // Format checkout
  const selectedFormat = formatId
    ? book.formats.find((f) => f.id === formatId)
    : book.formats[0];

  if (!selectedFormat) notFound();

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
      <p className="mt-1 text-sm text-gray-600">
        {book.title} — {FORMAT_LABELS[selectedFormat.type] || selectedFormat.type}
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
