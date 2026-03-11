import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  TrendingUp,
  Share2,
  Globe,
  Mail,
  Gift,
  Search,
  Users,
  ArrowRight,
  Package,
  PenTool,
  Building2,
  Megaphone,
  ChevronDown,
  Check,
} from "lucide-react";
import { FAQSection } from "@/components/marketing/faq-section";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Header */}
      <header className="border-b border-ink/[0.06]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-serif text-xl font-bold text-ink">Canopy</span>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <a href={process.env.NEXT_PUBLIC_WAITLIST_URL} target="_blank" rel="noopener noreferrer">
              <Button size="sm">Join the Waitlist</Button>
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
          <h1 className="mx-auto max-w-3xl font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            The Self-Publishing Platform Built for Growth
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-light">
            Canopy helps ambitious authors sell books, grow their audience, and
            keep more of what they earn.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <a href={process.env.NEXT_PUBLIC_WAITLIST_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg">
                Join the Waitlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link href="/demo">
              <Button variant="outline" size="lg">
                Try the demo
              </Button>
            </Link>
          </div>
        </section>

        {/* The Problem */}
        <section className="border-t border-ink/[0.06] bg-paper-warm">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
              Authors are expected to grow their own audiences — but the tools
              work against them
            </h2>
            <p className="mt-5 text-ink-light leading-relaxed">
              Amazon captures the customer relationship and withholds buyer
              data. IngramSpark offers distribution but zero audience insight.
              Motivated authors cobble together Shopify + Lulu + BookFunnel +
              MailerLite + Squarespace — spending more time on integrations
              than on writing and marketing.
            </p>
            <p className="mx-auto mt-6 max-w-xl border-l-2 border-ink py-2 pl-5 text-left font-serif text-lg font-semibold text-ink">
              Canopy is one place to publish, sell, own your audience, and grow
              your readership.
            </p>
          </div>
        </section>

        {/* Growth Lever 1: Sell Direct */}
        <section className="border-t border-ink/[0.06]">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-ink-muted">
              <TrendingUp className="h-4 w-4" />
              Growth lever 1
            </div>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink sm:text-3xl">
              Sell direct to readers
            </h2>
            <p className="mt-3 max-w-2xl text-ink-light">
              Build better, stronger customer relationships and long-term loyalty
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<BookOpen className="h-5 w-5" />}
                title="Beautiful book pages"
                description="Each title gets a polished sales page with cover art, description, pricing, and purchase options. Designed to convert — no web design skills required."
              />
              <FeatureCard
                icon={<Package className="h-5 w-5" />}
                title="More formats, more bundles"
                description="Sell hardcover, paperback, ebook, and the Canopy Reader edition — then bundle them with workbooks, courses, and bonus materials to increase your revenue per reader."
              />
              <FeatureCard
                icon={<Mail className="h-5 w-5" />}
                title="Email marketing"
                description="Capture emails from every page. Nurture your audience, announce new work, and convert free subscribers into buyers. No separate tool required."
              />
            </div>
          </div>
        </section>

        {/* Growth Lever 2: Supercharge Word-of-Mouth */}
        <section className="border-t border-ink/[0.06] bg-paper-warm">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-ink-muted">
              <Share2 className="h-4 w-4" />
              Growth lever 2
            </div>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink sm:text-3xl">
              Supercharge word-of-mouth
            </h2>
            <p className="mt-3 max-w-2xl text-ink-light">
              Word-of-mouth is the most powerful force in book marketing.
              Canopy makes it systematic.
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Users className="h-5 w-5" />}
                title="Reader referral program"
                description="Reward readers who refer new buyers. Built into the purchase and reading experience — not bolted on."
              />
              <FeatureCard
                icon={<Share2 className="h-5 w-5" />}
                title="Shareable sections"
                description="Every chapter of your Canopy Reader has its own URL. Readers highlight passages and share links to specific parts of your book on social media."
              />
              <FeatureCard
                icon={<Gift className="h-5 w-5" />}
                title="Gift links"
                description="Readers send copies to friends directly through Canopy, turning your most enthusiastic readers into a distribution channel."
              />
            </div>
          </div>
        </section>

        {/* Growth Lever 3: Reach New Readers */}
        <section className="border-t border-ink/[0.06]">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-ink-muted">
              <Globe className="h-4 w-4" />
              Growth lever 3
            </div>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink sm:text-3xl">
              Reach new readers
            </h2>
            <p className="mt-3 max-w-2xl text-ink-light">
              Expand beyond your existing audience through other people's
              audiences, organic discovery, and wide distribution.
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Users className="h-5 w-5" />}
                title="Affiliate program"
                description="Give influencers, podcasters, and partners trackable links with commission. Let other people sell your book for you."
              />
              <FeatureCard
                icon={<Search className="h-5 w-5" />}
                title="SEO and AI discovery"
                description="Every section of your Canopy Reader is indexed for search engines and AI answer engines. Your book is discoverable through the ideas inside it."
              />
              <FeatureCard
                icon={<Users className="h-5 w-5" />}
                title="Author cross-promotion"
                description="Team up with other Canopy authors to recommend each other's books — a built-in, community-powered discovery network that grows with the platform."
              />
            </div>
          </div>
        </section>

        {/* Publish Once, Sell Everywhere */}
        <section className="border-t border-ink/[0.06] bg-paper-warm">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="text-center font-serif text-2xl font-semibold text-ink sm:text-3xl">
              Publish once, sell everywhere
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-ink-light">
              All of this is powered by publishing infrastructure that handles
              production and fulfillment so you can focus on growth.
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <InfraCard
                title="Direct sales"
                description="Sell from your own book page with built-in checkout. You own the customer relationship, the data, and the revenue."
              />
              <InfraCard
                title="Canopy Reader"
                description="A web-based reading experience with highlights, notes, and sharing. Mobile-ready and SEO-indexed."
              />
              <InfraCard
                title="Global distribution"
                description="Opt into distribution to Amazon, bookstores, and libraries through Lulu's global network — while keeping direct sales as your primary channel."
              />
              <InfraCard
                title="Sales analytics"
                description="See where buyers come from, what they purchase, and how they engage with your book."
              />
            </div>
          </div>
        </section>

        {/* Who is Canopy for? */}
        <section className="border-t border-ink/[0.06]">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="text-center font-serif text-2xl font-semibold text-ink sm:text-3xl">
              Who is Canopy for?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-ink-light">
              Canopy is built for anyone who wants to sell more books and own the
              relationship with their readers.
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <div className="rounded-lg bg-paper p-6 shadow-warm-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper text-ink-light shadow-warm-sm">
                  <PenTool className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-ink">
                  Self-published authors
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-light">
                  You wrote the book and built the audience. Canopy gives you a
                  single platform to sell direct, keep your customer data, and
                  earn 2-5x more per book than retail channels.
                </p>
              </div>
              <div className="rounded-lg bg-paper p-6 shadow-warm-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper text-ink-light shadow-warm-sm">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-ink">
                  Hybrid publishers and authors
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-light">
                  Manage multiple titles and authors from one place. Canopy
                  handles production, fulfillment, and direct sales — so you can
                  focus on editorial quality and growing your catalog.
                </p>
              </div>
              <div className="rounded-lg bg-paper p-6 shadow-warm-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper text-ink-light shadow-warm-sm">
                  <Megaphone className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-ink">
                  Book marketing professionals
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-light">
                  Run campaigns with built-in affiliate links, referral
                  programs, email capture, and sales analytics. Everything you
                  need to drive and measure book sales in one dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-ink/[0.06] bg-paper-warm">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="text-center font-serif text-2xl font-semibold text-ink sm:text-3xl">
              Start free. Upgrade as you grow.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-ink-light">
              Canopy aligns its revenue with your success. You pay nothing until
              you sell — and as you scale, you keep more of every sale.
            </p>

            <div className="mx-auto mt-12 grid max-w-3xl gap-8 lg:grid-cols-2">
              {/* Free tier */}
              <div className="relative rounded-xl border-2 border-ink bg-paper p-8 shadow-warm-lg">
                <h3 className="font-serif text-2xl font-semibold text-ink">Free</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-bold text-ink">$0</span>
                  <span className="text-sm text-ink-muted">/month</span>
                </div>
                <p className="mt-2 inline-block rounded-md bg-paper-warm px-2 py-1 text-sm font-medium text-ink">
                  15% royalty fee per sale
                </p>
                <p className="mt-1 text-xs text-ink-muted">Plus print costs and 3.5% transaction fee</p>
                <p className="mt-4 text-sm leading-relaxed text-ink-light">
                  Start selling with zero upfront cost. Pay only when you make a sale.
                </p>
                <div className="mt-6">
                  <a href={process.env.NEXT_PUBLIC_WAITLIST_URL} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full" size="lg">
                      Join the Waitlist
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
                <ul className="mt-8 space-y-3">
                  {[
                    "Unlimited titles",
                    "Beautiful book pages",
                    "Canopy Reader edition",
                    "Print-on-demand fulfillment",
                    "Email capture",
                    "Sales dashboard",
                    "Wide distribution (Amazon, bookstores)",
                    "Customer data ownership",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-ink-light">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Subscription tier */}
              <div className="relative rounded-xl border border-ink/[0.08] bg-paper p-8 shadow-warm-sm">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper">
                  Coming soon
                </div>
                <h3 className="font-serif text-2xl font-semibold text-ink">Subscription</h3>
                <div className="mt-4">
                  <span className="font-serif text-2xl font-bold text-ink">Pricing TBA</span>
                </div>
                <p className="mt-2 inline-block rounded-md bg-paper-warm px-2 py-1 text-sm font-medium text-ink">
                  Lower royalty fee per sale
                </p>
                <p className="mt-1 text-xs text-ink-muted">Plus print costs and 3.5% transaction fee</p>
                <p className="mt-4 text-sm leading-relaxed text-ink-light">
                  A monthly plan with a reduced royalty fee. The more you sell, the more you keep.
                </p>
                <div className="mt-6">
                  <a href={process.env.NEXT_PUBLIC_WAITLIST_URL} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full" variant="outline" size="lg">
                      Join the Waitlist
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
                <ul className="mt-8 space-y-3">
                  {[
                    "Everything in Free, plus:",
                    "Reduced royalty fee — better unit economics",
                    "Referral program",
                    "Affiliate links & tracking",
                    "Email marketing tools",
                    "Bundle & premium edition support",
                    "Advanced sales analytics",
                    "Priority support",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-ink-light">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Every plan includes */}
            <div className="mx-auto mt-16 max-w-3xl text-center">
              <h3 className="font-serif text-xl font-semibold text-ink">
                Every plan includes
              </h3>
              <div className="mt-6 grid gap-4 text-left sm:grid-cols-2">
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
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-ink/[0.06]">
          <div className="mx-auto max-w-3xl px-6 py-20">
            <h2 className="text-center font-serif text-2xl font-semibold text-ink sm:text-3xl">
              Frequently asked questions
            </h2>
            <div className="mt-12">
              <FAQSection />
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-ink/[0.06]">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
              Stop publishing into a void
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-light leading-relaxed">
              Every other platform gives you a way to sell a book. Canopy gives
              you a way to grow a readership. Join the waitlist to be first in
              line when we launch.
            </p>
            <div className="mt-8">
              <a href={process.env.NEXT_PUBLIC_WAITLIST_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg">
                  Join the Waitlist
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper text-ink-light shadow-warm-sm">
        {icon}
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold text-ink">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-light">
        {description}
      </p>
    </div>
  );
}

function InfraCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg bg-paper p-5 shadow-warm-sm">
      <h3 className="font-serif text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-light">
        {description}
      </p>
    </div>
  );
}
