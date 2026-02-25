"use client";

import { useState } from "react";
import { Share2, Check, Link2, Twitter } from "lucide-react";

interface ShareButtonProps {
  url: string;
  title: string;
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 1500);
    } catch {
      // Fallback for older browsers
    }
  }

  function shareTwitter() {
    const text = encodeURIComponent(`Reading "${title}"`);
    const shareUrl = encodeURIComponent(url);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`,
      "_blank",
      "width=550,height=420"
    );
    setShowMenu(false);
  }

  function shareLinkedIn() {
    const shareUrl = encodeURIComponent(url);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      "_blank",
      "width=550,height=420"
    );
    setShowMenu(false);
  }

  function shareEmail() {
    const subject = encodeURIComponent(`Check out: ${title}`);
    const body = encodeURIComponent(`I'm reading "${title}" and thought you might enjoy it:\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowMenu(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="rounded-md p-2 text-ink-muted transition-colors hover:bg-paper-warm hover:text-ink-light"
        aria-label="Share"
      >
        <Share2 className="h-5 w-5" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-ink/[0.08] bg-paper-cool py-1 shadow-warm-md">
            <button
              onClick={copyLink}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-light hover:bg-paper-warm hover:text-ink"
            >
              {copied ? (
                <Check className="h-4 w-4 text-serif-success" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              onClick={shareTwitter}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-light hover:bg-paper-warm hover:text-ink"
            >
              <Twitter className="h-4 w-4" />
              Share on X
            </button>
            <button
              onClick={shareLinkedIn}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-light hover:bg-paper-warm hover:text-ink"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Share on LinkedIn
            </button>
            <button
              onClick={shareEmail}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-light hover:bg-paper-warm hover:text-ink"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Share via email
            </button>
          </div>
        </>
      )}
    </div>
  );
}
