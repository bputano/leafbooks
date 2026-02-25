"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/titles", label: "Titles", icon: BookOpen },
  { href: "/sales", label: "Sales", icon: BarChart3 },
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
          LeafBooks
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
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
