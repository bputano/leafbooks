"use client";

import { useEffect } from "react";

interface ProgressTrackerProps {
  bookId: string;
  sectionId: string;
}

/**
 * Client component that fires a progress update when the section is viewed.
 * Silently fails — non-critical.
 */
export function ProgressTracker({ bookId, sectionId }: ProgressTrackerProps) {
  useEffect(() => {
    fetch("/api/reader/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, sectionId }),
    }).catch(() => {
      // Silent — reader may not have a canopy session
    });
  }, [bookId, sectionId]);

  return null;
}
