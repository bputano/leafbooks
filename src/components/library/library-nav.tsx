"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Highlighter, User } from "lucide-react";

const navItems = [
  { href: "/library", label: "My Books", icon: BookOpen, exact: true },
  { href: "/library/highlights", label: "Highlights", icon: Highlighter },
  { href: "/library/profile", label: "Profile", icon: User },
];

export function LibraryNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-ink/[0.06] text-ink"
                : "text-ink-muted hover:bg-ink/[0.03] hover:text-ink-light"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
