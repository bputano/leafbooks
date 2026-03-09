"use client";

import { useSession } from "next-auth/react";
import { ExternalLink } from "lucide-react";

const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? "";
const WAITLIST_URL = process.env.NEXT_PUBLIC_WAITLIST_URL ?? "#";

export function DemoBanner() {
  const { data: session } = useSession();
  if (!session?.user?.id || session.user.id !== DEMO_USER_ID) return null;

  return (
    <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-6 py-2.5">
      <p className="text-sm text-amber-800">
        <span className="font-semibold">Demo mode</span> — You&apos;re
        exploring a sample Canopy account. Everything is read-only.
      </p>
      <a
        href={WAITLIST_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800"
      >
        Join the waitlist
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
