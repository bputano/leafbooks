import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RecentSalesProps {
  orders: {
    id: string;
    bookTitle: string;
    coverImageUrl: string | null;
    format: string;
    buyerName: string | null;
    buyerEmail: string;
    amount: number;
    platformFee: number;
    status: string;
    createdAt: string;
  }[];
}

export function RecentSales({ orders }: RecentSalesProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-[rgba(44,40,37,0.08)] bg-white p-6 shadow-warm-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base text-ink">Recent Sales</h2>
          <Link
            href="/sales"
            className="flex items-center gap-1 text-xs font-medium text-leaf-700 hover:text-leaf-800"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-ink-muted">
          No sales yet. They&apos;ll show up here once readers start buying.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[rgba(44,40,37,0.08)] bg-white p-6 shadow-warm-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-base text-ink">Recent Sales</h2>
        <Link
          href="/sales"
          className="flex items-center gap-1 text-xs font-medium text-leaf-700 hover:text-leaf-800"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {orders.map((order) => {
          const net = (order.amount - order.platformFee) / 100;
          const date = new Date(order.createdAt);
          return (
            <div key={order.id} className="flex items-center gap-3">
              {order.coverImageUrl ? (
                <img
                  src={order.coverImageUrl}
                  alt=""
                  className="h-10 w-7 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-7 items-center justify-center rounded bg-paper-warm text-xs text-ink-faint">
                  B
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {order.bookTitle}
                </p>
                <p className="truncate text-xs text-ink-muted">
                  {order.buyerName || order.buyerEmail} &middot;{" "}
                  {order.format.toLowerCase().replace("_", " ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-ink">
                  ${net.toFixed(2)}
                </p>
                <p className="text-xs text-ink-muted">
                  {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
