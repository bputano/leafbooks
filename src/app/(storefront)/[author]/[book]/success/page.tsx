import { Check } from "lucide-react";
import { db } from "@/lib/db";
import { EnhancedSuccess } from "@/components/storefront/success/enhanced-success";

interface SuccessPageProps {
  params: Promise<{ author: string; book: string }>;
  searchParams: Promise<{ payment_intent?: string }>;
}

export const metadata = {
  title: "Order Confirmed — Canopy",
};

export default async function SuccessPage({
  params,
  searchParams,
}: SuccessPageProps) {
  const { author: authorSlug, book: bookSlug } = await params;
  const { payment_intent: paymentIntentId } = await searchParams;

  // Look up the book
  const author = await db.author.findUnique({ where: { slug: authorSlug } });
  const book = author
    ? await db.book.findFirst({
        where: { authorId: author.id, slug: bookSlug },
        select: {
          id: true,
          title: true,
          coverImageUrl: true,
          giftLinksEnabled: true,
        },
      })
    : null;

  // Check purchase details
  let readerAccessToken: string | null = null;
  let hasDigitalFormat = false;
  let buyerEmail = "";
  let buyerName: string | null = null;

  if (paymentIntentId) {
    const order = await db.order.findFirst({
      where: { stripePaymentId: paymentIntentId },
      include: { bookFormat: true },
    });

    if (order) {
      buyerEmail = order.buyerEmail;
      buyerName = order.buyerName;

      if (order.bookFormat) {
        const isDigital =
          order.bookFormat.type === "EBOOK" ||
          order.bookFormat.type === "LEAF_EDITION";

        if (isDigital && order.buyerEmail) {
          hasDigitalFormat = true;
          const access = await db.readerAccess.findFirst({
            where: {
              bookId: order.bookId,
              buyerEmail: order.buyerEmail,
            },
          });
          if (access) {
            readerAccessToken = access.accessToken;
          }
        }
      }
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Order Confirmed!</h1>
        <p className="mt-2 text-gray-600">
          Thank you for your purchase. You&apos;ll receive a confirmation email
          shortly.
        </p>
      </div>

      <EnhancedSuccess
        authorSlug={authorSlug}
        bookSlug={bookSlug}
        bookTitle={book?.title || "this book"}
        coverImageUrl={book?.coverImageUrl || null}
        accessToken={readerAccessToken}
        buyerEmail={buyerEmail}
        buyerName={buyerName}
        bookId={book?.id || ""}
        giftLinksEnabled={book?.giftLinksEnabled ?? false}
        paymentIntentId={paymentIntentId || ""}
        hasDigitalFormat={hasDigitalFormat}
      />
    </div>
  );
}
