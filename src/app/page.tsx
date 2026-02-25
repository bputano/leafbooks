import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-leaf-700">LeafBooks</span>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Sell your books directly to readers
        </h1>
        <p className="mt-4 max-w-lg text-lg text-gray-600">
          Keep more of what you earn. LeafBooks gives self-published authors the
          tools to sell direct — print, ebook, and beyond.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/register">
            <Button size="lg">Start selling</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign in
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
