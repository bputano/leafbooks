import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { luluProvider } from "@/lib/fulfillment/lulu-provider";
import { getPublicUrl } from "@/lib/storage";
import { grantAccess } from "@/lib/reader/access";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(paymentIntent);
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailure(paymentIntent);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const {
    bookId,
    formatId,
    buyerEmail,
    buyerName,
    authorId,
    formatType,
  } = paymentIntent.metadata;

  if (!bookId || !formatId) return;

  // Create Order record
  const order = await db.order.create({
    data: {
      bookId,
      bookFormatId: formatId,
      buyerEmail: buyerEmail || "",
      buyerName: buyerName || null,
      amount: paymentIntent.amount,
      platformFee: paymentIntent.application_fee_amount || 0,
      currency: paymentIntent.currency.toUpperCase(),
      stripePaymentId: paymentIntent.id,
      status: "PAID",
      format: formatType === "EBOOK" || formatType === "LEAF_EDITION" ? "EBOOK" : "PRINT",
      shippingAddress: paymentIntent.shipping?.address
        ? JSON.parse(JSON.stringify(paymentIntent.shipping))
        : undefined,
    },
  });

  // Capture buyer email for author's subscriber list
  if (buyerEmail && authorId) {
    await db.emailSubscriber.upsert({
      where: {
        authorId_email: {
          authorId,
          email: buyerEmail,
        },
      },
      create: {
        authorId,
        email: buyerEmail,
        name: buyerName || null,
        source: "purchase",
      },
      update: {}, // Don't overwrite existing subscriber data
    });
  }

  // Grant reader access for digital formats
  if (
    (formatType === "EBOOK" || formatType === "LEAF_EDITION") &&
    buyerEmail
  ) {
    try {
      await grantAccess(bookId, buyerEmail, order.id);
    } catch (error) {
      console.error("Failed to grant reader access:", error);
    }
  }

  // Trigger Lulu fulfillment for print formats
  if (formatType !== "EBOOK" && formatType !== "LEAF_EDITION") {
    const format = await db.bookFormat.findUnique({
      where: { id: formatId },
      include: { book: { include: { author: true } } },
    });

    if (
      format &&
      format.book.status === "PUBLISHED" &&
      !format.book.isPreOrder &&
      paymentIntent.shipping?.address
    ) {
      try {
        const result = await luluProvider.createOrder({
          externalId: order.id,
          title: format.book.title,
          coverFileUrl: format.coverFileUrl
            ? getPublicUrl(format.coverFileUrl)
            : getPublicUrl(format.book.coverFileUrl || ""),
          interiorFileUrl: format.interiorFileUrl
            ? getPublicUrl(format.interiorFileUrl)
            : getPublicUrl(format.book.manuscriptFileUrl || ""),
          podPackageId: format.luluPodPackageId || "",
          quantity: 1,
          shippingAddress: {
            name: paymentIntent.shipping.name || "",
            street1: paymentIntent.shipping.address.line1 || "",
            street2: paymentIntent.shipping.address.line2 || undefined,
            city: paymentIntent.shipping.address.city || "",
            stateCode: paymentIntent.shipping.address.state || undefined,
            countryCode: paymentIntent.shipping.address.country || "US",
            postcode: paymentIntent.shipping.address.postal_code || "",
          },
          shippingLevel: "MAIL",
          contactEmail: buyerEmail,
        });

        await db.order.update({
          where: { id: order.id },
          data: {
            luluOrderId: result.providerOrderId,
            // Status remains PAID — Lulu webhook will update to FULFILLED when shipped
          },
        });
      } catch (error) {
        console.error("Lulu fulfillment failed:", error);
        // Don't fail the webhook — order is still paid
      }
    }
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const { bookId, formatId, buyerEmail } = paymentIntent.metadata;
  if (!bookId || !formatId) return;

  // Check if an order was already created
  const existing = await db.order.findUnique({
    where: { stripePaymentId: paymentIntent.id },
  });

  if (existing) {
    await db.order.update({
      where: { id: existing.id },
      data: { status: "FAILED" },
    });
  }
}
