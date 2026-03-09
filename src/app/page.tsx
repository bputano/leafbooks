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
} from "lucide-react";

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
            <Link href="/register">
              <Button size="sm">Start selling</Button>
            </Link>
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
            <Link href="/register">
              <Button size="lg">
                Start selling
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign in
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
            <p className="mt-4 font-medium text-ink">
              Canopy is one place to publish, sell, own your audience, and grow
              your readership.
            </p>
          </div>
        </section>

        {/* Growth Lever 1: Sell More Books */}
        <section className="border-t border-ink/[0.06]">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-ink-muted">
              <TrendingUp className="h-4 w-4" />
              Growth lever 1
            </div>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink sm:text-3xl">
              Sell more books to your existing audience
            </h2>
            <p className="mt-3 max-w-2xl text-ink-light">
              Convert followers into buyers — and buyers into repeat customers.
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<BookOpen className="h-5 w-5" />}
                title="Beautiful book pages"
                description="Each title gets a polished sales page with cover art, description, pricing, and purchase options. Designed to convert — no web design skills required."
              />
              <FeatureCard
                icon={<Package className="h-5 w-5" />}
                title="All formats, one place"
                description="Sell hardcover, paperback, ebook, and the Canopy Reader edition — all from a single listing. More formats means more ways to buy."
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
                icon={<Globe className="h-5 w-5" />}
                title="Wide distribution"
                description="Opt into distribution to Amazon, bookstores, and libraries through Lulu's global network — while keeping direct sales as your primary channel."
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
                title="Print-on-demand"
                description="Physical books produced and shipped via Lulu's global network. No inventory, no upfront costs."
              />
              <InfraCard
                title="Canopy Reader"
                description="A web-based reading experience with highlights, notes, and sharing. Mobile-ready and SEO-indexed."
              />
              <InfraCard
                title="Author library"
                description="Each author gets a profile page showcasing all their books — their home base on Canopy."
              />
              <InfraCard
                title="Sales analytics"
                description="See where buyers come from, what they purchase, and how they engage with your book."
              />
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
              you a way to grow a readership. Create your free account and
              publish your first title today.
            </p>
            <div className="mt-8">
              <Link href="/register">
                <Button size="lg">
                  Start selling
                  <ArrowRight className="ml-2 h-4 w-4" />
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
