import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface TopReferrersProps {
  referrers: {
    email: string;
    conversions: number;
    clicks: number;
  }[];
}

export function TopReferrers({ referrers }: TopReferrersProps) {
  if (referrers.length === 0) {
    return (
      <div className="rounded-xl border border-[rgba(44,40,37,0.08)] bg-white p-6 shadow-warm-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base text-ink">Top Referrers</h2>
          <Link
            href="/grow/referrals"
            className="flex items-center gap-1 text-xs font-medium text-leaf-700 hover:text-leaf-800"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-ink-muted">
          Enable referrals to see who&apos;s spreading the word.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[rgba(44,40,37,0.08)] bg-white p-6 shadow-warm-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-base text-ink">Top Referrers</h2>
        <Link
          href="/grow/referrals"
          className="flex items-center gap-1 text-xs font-medium text-leaf-700 hover:text-leaf-800"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="mt-4">
        <div className="grid grid-cols-3 gap-2 border-b border-[rgba(44,40,37,0.08)] pb-2 text-xs font-medium text-ink-muted">
          <span>Referrer</span>
          <span className="text-center">Clicks</span>
          <span className="text-right">Conversions</span>
        </div>
        <div className="mt-2 space-y-2">
          {referrers.map((r) => (
            <div key={r.email} className="grid grid-cols-3 gap-2 text-sm">
              <span className="truncate text-ink">{r.email}</span>
              <span className="text-center text-ink-muted">{r.clicks}</span>
              <span className="text-right font-medium text-ink">{r.conversions}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
