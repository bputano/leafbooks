import Link from "next/link";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper-cool">
      <header className="border-b border-ink/[0.06]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-ink">
            Serif
          </Link>
        </div>
      </header>
      <main>{children}</main>
      {/* Colophon — like a publisher's imprint on the copyright page */}
      <footer className="mt-24 border-t border-ink/[0.06] py-10 text-center">
        <Link
          href="/"
          className="font-serif text-sm tracking-wide text-ink-muted transition-colors hover:text-ink-light"
        >
          Serif
        </Link>
      </footer>
    </div>
  );
}
