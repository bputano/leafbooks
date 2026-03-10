import Link from "next/link";
import { BookOpen, CreditCard, Users } from "lucide-react";

export function EmptyDashboard() {
  const actions = [
    {
      icon: BookOpen,
      title: "Add your first book",
      description: "Upload a manuscript and set up your landing page.",
      href: "/titles",
      cta: "Add book",
    },
    {
      icon: CreditCard,
      title: "Set up payments",
      description: "Connect Stripe to start accepting orders.",
      href: "/settings/payments",
      cta: "Connect Stripe",
    },
    {
      icon: Users,
      title: "Invite readers",
      description: "Share your book link and start building your audience.",
      href: "/grow",
      cta: "Grow audience",
    },
  ];

  return (
    <div className="text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-leaf-50">
          <BookOpen className="h-10 w-10 text-leaf-600" />
        </div>
        <h2 className="mt-4 font-serif text-xl text-ink">Your story starts here</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Set up your author profile, add your first book, and start selling directly to readers.
        </p>
      </div>
      <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-xl border border-[rgba(44,40,37,0.08)] bg-white p-5 shadow-warm-sm transition-all hover:border-leaf-200 hover:shadow-warm-md"
          >
            <action.icon className="mx-auto h-8 w-8 text-leaf-600" />
            <h3 className="mt-3 text-sm font-semibold text-ink">{action.title}</h3>
            <p className="mt-1 text-xs text-ink-muted">{action.description}</p>
            <span className="mt-3 inline-block text-xs font-medium text-leaf-700 group-hover:text-leaf-800">
              {action.cta} &rarr;
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
