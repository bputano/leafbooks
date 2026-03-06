import { redirect } from "next/navigation";
import Link from "next/link";
import { getReaderSession } from "@/lib/reader/reader-session";
import { LibraryNav } from "@/components/library/library-nav";

export const metadata = {
  title: "My Library — Canopy",
};

export default async function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = await getReaderSession();

  if (!email) {
    redirect("/library/login");
  }

  return (
    <div className="min-h-screen bg-paper-cool">
      <header className="border-b border-ink/[0.06]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/library"
            className="font-serif text-lg font-semibold tracking-tight text-ink"
          >
            Canopy
          </Link>
          <LibraryNav />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      <footer className="mt-24 border-t border-ink/[0.06] py-10 text-center">
        <Link
          href="/library"
          className="font-serif text-sm tracking-wide text-ink-muted transition-colors hover:text-ink-light"
        >
          Canopy
        </Link>
      </footer>
    </div>
  );
}
