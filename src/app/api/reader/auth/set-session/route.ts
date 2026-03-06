import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createReaderSession,
  setReaderSessionCookie,
} from "@/lib/reader/reader-session";

/**
 * Auto-authenticate a buyer after purchase.
 * Verifies the payment belongs to the email before creating a session.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, paymentIntentId } = body;

  if (!email || !paymentIntentId) {
    return NextResponse.json(
      { error: "Email and paymentIntentId required" },
      { status: 400 }
    );
  }

  // Verify the payment belongs to this email
  const order = await db.order.findFirst({
    where: {
      stripePaymentId: paymentIntentId,
      buyerEmail: email.trim().toLowerCase(),
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Payment not found for this email" },
      { status: 403 }
    );
  }

  const sessionToken = await createReaderSession(email.trim().toLowerCase());
  await setReaderSessionCookie(sessionToken);

  return NextResponse.json({ success: true });
}
