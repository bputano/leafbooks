import { getAuthor } from "@/lib/auth/get-author";
import { getAccountStatus } from "@/lib/stripe/connect";
import { StripeConnectSetup } from "@/components/dashboard/stripe-connect-banner";

export const metadata = {
  title: "Payments — LeafBooks",
};

export default async function PaymentsPage() {
  const author = await getAuthor();

  let stripeStatus = null;
  if (author.stripeAccountId) {
    try {
      stripeStatus = await getAccountStatus(author.stripeAccountId);
    } catch {
      // Stripe account might be invalid
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
      <p className="mt-1 text-sm text-gray-600">
        Connect your Stripe account to receive payouts from book sales.
      </p>
      <div className="mt-8 max-w-lg">
        <StripeConnectSetup
          connected={!!stripeStatus?.chargesEnabled}
          detailsSubmitted={!!stripeStatus?.detailsSubmitted}
          accountId={author.stripeAccountId}
        />
      </div>
    </div>
  );
}
