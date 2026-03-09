import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { PLATFORM_FEES } from "@/config/pricing";
import { z } from "zod";

const checkoutSchema = z.object({
  bookId: z.string(),
  formatId: z.string(),
  bundleId: z.string().optional(),
  buyerEmail: z.string().email(),
  buyerName: z.string().optional(),
  shippingAddress: z
    .object({
      name: z.string(),
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string().optional(),
      postal_code: z.string(),
      country: z.string(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { bookId, formatId, bundleId, buyerEmail, buyerName, shippingAddress } =
    parsed.data;

  // Load book, format, and author
  const format = await db.bookFormat.findFirst({
    where: { id: formatId, bookId },
    include: {
      book: {
        include: {
          author: true,
        },
      },
    },
  });

  if (!format || !format.book || format.book.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: "Book or format not found" },
      { status: 404 }
    );
  }

  const author = format.book.author;
  if (!author.stripeAccountId) {
    return NextResponse.json(
      { error: "Author has not connected Stripe" },
      { status: 400 }
    );
  }

  // If bundle, look up bundle price
  let chargeAmount = format.price;
  let chargeCurrency = format.currency;
  if (bundleId) {
    const bundle = await db.bundle.findFirst({
      where: { id: bundleId, bookId, isActive: true },
    });
    if (bundle) {
      chargeAmount = bundle.price;
      chargeCurrency = bundle.currency;
    }
  }

  // Calculate fees
  const feeRate =
    PLATFORM_FEES[author.subscriptionTier as keyof typeof PLATFORM_FEES] ?? 0.2;
  const applicationFee = Math.round(chargeAmount * feeRate);

  // Create PaymentIntent with destination charge
  const paymentIntent = await stripe.paymentIntents.create({
    amount: chargeAmount,
    currency: chargeCurrency.toLowerCase(),
    application_fee_amount: applicationFee,
    transfer_data: {
      destination: author.stripeAccountId,
    },
    receipt_email: buyerEmail,
    metadata: {
      bookId,
      formatId,
      bundleId: bundleId || "",
      buyerEmail,
      buyerName: buyerName || "",
      authorId: author.id,
      formatType: format.type,
    },
    ...(shippingAddress
      ? {
          shipping: {
            name: shippingAddress.name,
            address: {
              line1: shippingAddress.line1,
              line2: shippingAddress.line2,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.postal_code,
              country: shippingAddress.country,
            },
          },
        }
      : {}),
    automatic_payment_methods: { enabled: true },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    amount: chargeAmount,
    currency: chargeCurrency,
  });
}
