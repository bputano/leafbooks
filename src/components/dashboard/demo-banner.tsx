"use client";

import { useSession } from "next-auth/react";
import { ExternalLink } from "lucide-react";

const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? "";
const WAITLIST_URL = process.env.NEXT_PUBLIC_WAITLIST_URL ?? "#";

export function DemoBanner() {
  const { data: session } = useSession();
  if (!session?.user?.id || session.user.id !== DEMO_USER_ID) return null;

  return (
    <div className="flex flex-col items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-amber-800 sm:text-sm">
        <span className="font-semibold">Demo mode</span> — Exploring a
        sample account. Read-only.
      </p>
      <a
        href={WAITLIST_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800"
      >
        Join the waitlist
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
