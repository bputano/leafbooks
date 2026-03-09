import { SessionProvider } from "next-auth/react";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { DemoWriteInterceptor } from "@/components/dashboard/demo-write-interceptor";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <DemoBanner />
        <div className="flex flex-1">
          <SidebarNav />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
          </main>
        </div>
      </div>
      <DemoWriteInterceptor />
    </SessionProvider>
  );
}
