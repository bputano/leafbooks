"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

export default function DemoPage() {
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_DEMO_TOKEN;
    if (!token) {
      setError(true);
      return;
    }
    signIn("credentials", {
      email: "demo",
      password: token,
      callbackUrl: "/readers",
    });
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-ink-light">Demo is not currently available.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="text-center">
        <p className="font-serif text-lg text-ink">Loading demo...</p>
        <p className="mt-2 text-sm text-ink-muted">
          Setting up a sample account for you to explore.
        </p>
      </div>
    </div>
  );
}
