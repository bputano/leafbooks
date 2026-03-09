import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Canopy",
  description:
    "Start free. Upgrade as you grow. Canopy aligns its revenue with your success.",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description:
      "Start selling with zero upfront cost. Pay only when you make a sale.",
    feeLabel: "15% royalty fee per sale",
    feeNote: "Plus print costs and 3.5% transaction fee",
    highlight: false,
    cta: "Get started",
    features: [
      "Unlimited titles",
      "Beautiful book pages",
      "Canopy Reader edition",
      "Print-on-demand fulfillment",
      "Email capture",
      "Sales dashboard",
      "Wide distribution (Amazon, bookstores)",
      "Customer data ownership",
    ],
  },
  {
    name: "Subscription",
    price: null,
    period: null,
    description:
      "A monthly plan with a reduced royalty fee. The more you sell, the more you keep.",
    feeLabel: "Lower royalty fee per sale",
    feeNote: "Plus print costs and 3.5% transaction fee",
    highlight: true,
    cta: "Join the waitlist",
    features: [
      "Everything in Free, plus:",
      "Reduced royalty fee — better unit economics",
      "Referral program",
      "Affiliate links & tracking",
      "Email marketing tools",
      "Bundle & premium edition support",
      "Advanced sales analytics",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Header */}
      <header className="border-b border-ink/[0.06]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/">
            <span className="font-serif text-xl font-bold text-ink">
              Canopy
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/demo">
              <Button variant="ghost" size="sm">
                Try the demo
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Start selling</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Start free. Upgrade as you grow.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-ink-light">
            Canopy aligns its revenue with your success. You pay nothing until
            you sell — and as you scale, you keep more of every sale.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="mx-auto grid max-w-3xl gap-8 lg:grid-cols-2">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-xl p-8 ${
                  tier.highlight
                    ? "border-2 border-ink bg-paper shadow-warm-lg"
                    : "border border-ink/[0.08] bg-paper shadow-warm-sm"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper">
                    Coming soon
                  </div>
                )}
                <h2 className="font-serif text-2xl font-semibold text-ink">
                  {tier.name}
                </h2>
                {tier.price !== null ? (
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-bold text-ink">
                      {tier.price}
                    </span>
                    <span className="text-sm text-ink-muted">
                      {tier.period}
                    </span>
                  </div>
                ) : (
                  <div className="mt-4">
                    <span className="font-serif text-2xl font-bold text-ink">
                      Pricing TBA
                    </span>
                  </div>
                )}
                <p className="mt-2 inline-block rounded-md bg-paper-warm px-2 py-1 text-sm font-medium text-ink">
                  {tier.feeLabel}
                </p>
                <p className="mt-1 text-xs text-ink-muted">{tier.feeNote}</p>
                <p className="mt-4 text-sm leading-relaxed text-ink-light">
                  {tier.description}
                </p>

                <div className="mt-6">
                  <Link href="/register">
                    <Button
                      className="w-full"
                      variant={tier.highlight ? "primary" : "outline"}
                      size="lg"
                    >
                      {tier.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-ink-light"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* All plans include */}
        <section className="border-t border-ink/[0.06] bg-paper-warm">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Every plan includes
            </h2>
            <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
              {[
                "Full customer data ownership",
                "Print-on-demand fulfillment via Lulu",
                "Canopy Reader web edition",
                "Wide distribution to Amazon & bookstores",
                "Stripe-powered checkout",
                "No upfront costs — ever",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-ink" />
                  <span className="text-sm text-ink-light">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-ink/[0.06]">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Ready to sell direct?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-light">
              Create your free account and publish your first title today. No
              credit card required.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg">
                  Start selling
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg">
                  Try the demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink/[0.06] bg-paper-warm">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-center text-sm text-ink-muted">
            Canopy — the self-publishing platform built for growth
          </p>
        </div>
      </footer>
    </div>
  );
}
