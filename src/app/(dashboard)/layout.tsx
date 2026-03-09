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
        <div className="flex flex-1 flex-col lg:flex-row">
          <SidebarNav />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <DemoWriteInterceptor />
    </SessionProvider>
  );
}
