import Link from "next/link";
import { Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

interface SuccessPageProps {
  params: Promise<{ author: string; book: string }>;
  searchParams: Promise<{ payment_intent?: string }>;
}

export const metadata = {
  title: "Order Confirmed — LeafBooks",
};

export default async function SuccessPage({
  params,
  searchParams,
}: SuccessPageProps) {
  const { author: authorSlug, book: bookSlug } = await params;
  const { payment_intent: paymentIntentId } = await searchParams;

  // Check if the purchase includes a digital format (Leaf Edition / Ebook)
  let readerAccessToken: string | null = null;
  let hasDigitalFormat = false;

  if (paymentIntentId) {
    const order = await db.order.findFirst({
      where: { stripePaymentId: paymentIntentId },
      include: { bookFormat: true },
    });

    if (order?.bookFormat) {
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

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <Check className="h-8 w-8 text-green-600" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Order Confirmed!</h1>
      <p className="mt-2 text-gray-600">
        Thank you for your purchase. You&apos;ll receive a confirmation email
        shortly.
      </p>

      <div className="mt-8 space-y-3">
        {hasDigitalFormat && readerAccessToken && (
          <Link
            href={`/${authorSlug}/${bookSlug}/read?token=${readerAccessToken}`}
          >
            <Button size="lg" className="w-full">
              <BookOpen className="mr-2 h-5 w-5" />
              Start Reading Now
            </Button>
          </Link>
        )}

        <Link href={`/${authorSlug}/${bookSlug}`}>
          <Button variant="outline" className="w-full">
            Back to Book Page
          </Button>
        </Link>
        <Link href={`/${authorSlug}`}>
          <Button variant="ghost" className="w-full">
            Browse More Books
          </Button>
        </Link>
      </div>
    </div>
  );
}
