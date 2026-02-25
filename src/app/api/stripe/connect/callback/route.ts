import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAccountStatus } from "@/lib/stripe/connect";

// Check the status of a Stripe Connect account after onboarding
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const author = await db.author.findUnique({
    where: { userId: session.user.id },
  });
  if (!author?.stripeAccountId) {
    return NextResponse.json({ error: "No Stripe account" }, { status: 404 });
  }

  const status = await getAccountStatus(author.stripeAccountId);

  const searchParams = req.nextUrl.searchParams;
  if (searchParams.get("success") === "true") {
    return NextResponse.redirect(
      new URL("/settings/payments?connected=true", req.url)
    );
  }

  return NextResponse.json({ status });
}
