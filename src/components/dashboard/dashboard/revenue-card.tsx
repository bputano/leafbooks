import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface RevenueCardProps {
  revenue: { thisMonth: number; lastMonth: number };
}

export function RevenueCard({ revenue }: RevenueCardProps) {
  const { thisMonth, lastMonth } = revenue;
  const diff = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : thisMonth > 0 ? 100 : 0;
  const isUp = diff >= 0;

  return (
    <div className="rounded-xl border border-[rgba(44,40,37,0.08)] border-l-4 border-l-leaf-600 bg-white p-6 shadow-warm-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-muted">Revenue This Month</p>
        <Link
          href="/sales"
          className="flex items-center gap-1 text-xs font-medium text-leaf-700 hover:text-leaf-800"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <p className="mt-2 font-serif text-3xl font-bold text-ink">
        ${(thisMonth / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        {isUp ? (
          <TrendingUp className="h-4 w-4 text-serif-success" />
        ) : (
          <TrendingDown className="h-4 w-4 text-serif-error" />
        )}
        <span className={`text-sm font-medium ${isUp ? "text-serif-success" : "text-serif-error"}`}>
          {isUp ? "+" : ""}{diff}%
        </span>
        <span className="text-sm text-ink-muted">vs last month</span>
      </div>
    </div>
  );
}
