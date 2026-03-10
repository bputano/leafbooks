import Link from "next/link";
import { Users, BookOpen, Mail, Percent } from "lucide-react";

interface QuickStatsProps {
  stats: {
    totalReaders: number;
    newReadersThisMonth: number;
    publishedBooks: number;
    totalEmailSubs: number;
    conversionRate: number;
  };
}

export function QuickStats({ stats }: QuickStatsProps) {
  const items = [
    {
      label: "Readers",
      value: stats.totalReaders.toLocaleString(),
      sub: `+${stats.newReadersThisMonth} this month`,
      icon: Users,
      href: "/readers",
    },
    {
      label: "Books",
      value: stats.publishedBooks.toString(),
      sub: "published",
      icon: BookOpen,
      href: "/titles",
    },
    {
      label: "Subscribers",
      value: stats.totalEmailSubs.toLocaleString(),
      sub: "email list",
      icon: Mail,
      href: "/grow",
    },
    {
      label: "Conversion",
      value: `${stats.conversionRate}%`,
      sub: "reader → buyer",
      icon: Percent,
      href: "/readers",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="rounded-xl border border-[rgba(44,40,37,0.08)] bg-paper-warm p-4 shadow-warm-sm transition-colors hover:bg-white"
        >
          <div className="flex items-center gap-2">
            <item.icon className="h-4 w-4 text-leaf-600" />
            <span className="text-xs font-medium text-ink-muted">{item.label}</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-ink">{item.value}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{item.sub}</p>
        </Link>
      ))}
    </div>
  );
}
