"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ReferralTracker() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  useEffect(() => {
    if (!ref) return;

    // Store ref code in cookie (30 day expiry)
    document.cookie = `canopy_ref=${ref}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

    // Track the click
    fetch("/api/referrals/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode: ref }),
    }).catch(() => {});
  }, [ref]);

  return null;
}
