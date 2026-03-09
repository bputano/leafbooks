"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";

const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? "";
const WAITLIST_URL = process.env.NEXT_PUBLIC_WAITLIST_URL ?? "#";

export function DemoWriteInterceptor() {
  const { data: session } = useSession();
  const isDemo = session?.user?.id === DEMO_USER_ID && !!DEMO_USER_ID;
  const [toast, setToast] = useState(false);

  const dismiss = useCallback(() => setToast(false), []);

  useEffect(() => {
    if (!isDemo) return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 403) {
        const clone = response.clone();
        const body = await clone.json().catch(() => null);
        if (body?.error?.includes("demo")) {
          setToast(true);
          setTimeout(() => setToast(false), 4000);
        }
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isDemo]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
        <p className="text-sm text-amber-800">
          This is a demo account.{" "}
          <a
            href={WAITLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            Join the waitlist
          </a>{" "}
          to start building!
        </p>
        <button onClick={dismiss} className="text-amber-600 hover:text-amber-800">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
