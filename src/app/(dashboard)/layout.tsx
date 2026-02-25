import { SessionProvider } from "next-auth/react";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-gray-50">
        <SidebarNav />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
