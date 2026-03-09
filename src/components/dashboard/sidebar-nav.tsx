"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  BarChart3,
  Users,
  Gift,
  Sprout,
  Mail,
  Handshake,
  ArrowLeftRight,
  Settings,
  CreditCard,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/titles", label: "Titles", icon: BookOpen },
  { href: "/sales", label: "Sales", icon: BarChart3 },
  { href: "/readers", label: "Readers", icon: Users },
  { href: "/bonus-library", label: "Bonus Library", icon: Gift },
  {
    href: "/grow",
    label: "Grow",
    icon: Sprout,
    children: [
      { href: "/grow", label: "Email Subscribers", icon: Mail },
      { href: "/grow/referrals", label: "Referrals", icon: Users },
      { href: "/grow/affiliates", label: "Affiliates", icon: Handshake },
      { href: "/grow/cross-promote", label: "Cross-Promote", icon: ArrowLeftRight },
    ],
  },
  { href: "/settings", label: "Settings", icon: Settings },
  {
    href: "/settings/payments",
    label: "Payments",
    icon: CreditCard,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/titles" className="text-xl font-bold text-leaf-700">
          Canopy
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const hasChildren = "children" in item && item.children;
          const isExpanded = isActive;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-leaf-50 text-leaf-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
              {hasChildren && isExpanded && (
                <div className="ml-5 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
                  {item.children.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          childActive
                            ? "text-leaf-700"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <child.icon className="h-3.5 w-3.5" />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
