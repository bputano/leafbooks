import Link from "next/link";
import { LoginForm } from "@/components/library/login-form";

export const metadata = {
  title: "Sign In — Canopy",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper-cool px-4">
      <div className="mb-8">
        <Link
          href="/"
          className="font-serif text-2xl font-semibold tracking-tight text-ink"
        >
          Canopy
        </Link>
      </div>
      <div className="w-full max-w-sm rounded-xl bg-paper p-8 shadow-sm ring-1 ring-ink/[0.08]">
        <h1 className="mb-1 font-serif text-xl font-semibold text-ink">
          Sign in to your library
        </h1>
        <p className="mb-6 text-sm text-ink-muted">
          Enter the email you used to purchase your books.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
