import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createExpressAccount, createOnboardingLink } from "@/lib/stripe/connect";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const author = await db.author.findUnique({
      where: { userId: session.user.id },
      include: { user: { include: { emails: { where: { isPrimary: true } } } } },
    });
    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const email = author.user.emails[0]?.email;
    if (!email) {
      return NextResponse.json(
        { error: "No primary email found. Please add an email to your account." },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // If already connected, create a new onboarding link (for account updates)
    if (author.stripeAccountId) {
      const link = await createOnboardingLink(
        author.stripeAccountId,
        `${baseUrl}/settings/payments?success=true`,
        `${baseUrl}/settings/payments?refresh=true`
      );
      return NextResponse.json({ url: link.url });
    }

    // Create new Express account
    const account = await createExpressAccount(email);

    // Save Stripe account ID
    await db.author.update({
      where: { id: author.id },
      data: { stripeAccountId: account.id },
    });

    // Create onboarding link
    const link = await createOnboardingLink(
      account.id,
      `${baseUrl}/settings/payments?success=true`,
      `${baseUrl}/settings/payments?refresh=true`
    );

    return NextResponse.json({ url: link.url });
  } catch (error) {
    console.error("Stripe Connect error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to connect Stripe: ${message}` },
      { status: 500 }
    );
  }
}
