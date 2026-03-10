"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { RevenueCard } from "./revenue-card";
import { QuickStats } from "./quick-stats";
import { EmailGrowthChart } from "./email-growth-chart";
import { RecentSales } from "./recent-sales";
import { TopBooks } from "./top-books";
import { TopReferrers } from "./top-referrers";
import { EmptyDashboard } from "./empty-dashboard";
import { CustomizePanel } from "./customize-panel";

export interface DashboardProps {
  authorName: string;
  isEmpty: boolean;
  revenue: { thisMonth: number; lastMonth: number };
  stats: {
    totalReaders: number;
    newReadersThisMonth: number;
    publishedBooks: number;
    totalEmailSubs: number;
    conversionRate: number;
  };
  emailGrowth: { month: string; subscribers: number }[];
  recentOrders: {
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
  topBooks: {
    bookId: string;
    title: string;
    coverImageUrl: string | null;
    orders: number;
    revenue: number;
  }[];
  topReferrers: {
    email: string;
    conversions: number;
    clicks: number;
  }[];
}

interface WidgetConfig {
  id: string;
  visible: boolean;
  order: number;
}

interface DashboardLayout {
  version: 1;
  widgets: WidgetConfig[];
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "revenue", visible: true, order: 0 },
  { id: "quick-stats", visible: true, order: 1 },
  { id: "email-growth", visible: true, order: 2 },
  { id: "recent-sales", visible: true, order: 3 },
  { id: "top-books", visible: true, order: 4 },
  { id: "top-referrers", visible: true, order: 5 },
];

const STORAGE_KEY = "canopy-dashboard-layout";

function loadLayout(): WidgetConfig[] {
  if (typeof window === "undefined") return DEFAULT_WIDGETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const parsed: DashboardLayout = JSON.parse(raw);
    if (parsed.version !== 1) return DEFAULT_WIDGETS;
    // Merge with defaults in case new widgets were added
    const stored = new Map(parsed.widgets.map((w) => [w.id, w]));
    return DEFAULT_WIDGETS.map((d) => stored.get(d.id) ?? d).sort((a, b) => {
      const sa = stored.get(a.id);
      const sb = stored.get(b.id);
      return (sa?.order ?? a.order) - (sb?.order ?? b.order);
    });
  } catch {
    return DEFAULT_WIDGETS;
  }
}

function saveLayout(widgets: WidgetConfig[]) {
  const layout: DashboardLayout = { version: 1, widgets };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

export function DashboardClient(props: DashboardProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [showCustomize, setShowCustomize] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setWidgets(loadLayout());
    setMounted(true);
  }, []);

  const handleUpdateWidgets = (updated: WidgetConfig[]) => {
    setWidgets(updated);
    saveLayout(updated);
  };

  if (props.isEmpty) {
    return (
      <div>
        <h1 className="font-serif text-2xl text-ink">
          Welcome, {props.authorName}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Your author dashboard
        </p>
        <div className="mt-8">
          <EmptyDashboard />
        </div>
      </div>
    );
  }

  const visibleWidgets = mounted
    ? widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order)
    : DEFAULT_WIDGETS;

  const renderWidget = (id: string) => {
    switch (id) {
      case "revenue":
        return <RevenueCard revenue={props.revenue} />;
      case "quick-stats":
        return <QuickStats stats={props.stats} />;
      case "email-growth":
        return <EmailGrowthChart data={props.emailGrowth} />;
      case "recent-sales":
        return <RecentSales orders={props.recentOrders} />;
      case "top-books":
        return <TopBooks books={props.topBooks} />;
      case "top-referrers":
        return <TopReferrers referrers={props.topReferrers} />;
      default:
        return null;
    }
  };

  // Group widgets: first two side by side, email-growth full width, then pairs
  const widgetIds = visibleWidgets.map((w) => w.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-ink">
            Welcome back, {props.authorName}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Here&apos;s how your books are doing
          </p>
        </div>
        <button
          onClick={() => setShowCustomize(!showCustomize)}
          className="flex items-center gap-2 rounded-lg border border-[rgba(44,40,37,0.08)] bg-white px-3 py-2 text-sm text-ink-light shadow-warm-sm transition-colors hover:bg-paper-warm"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Customize
        </button>
      </div>

      {showCustomize && (
        <div className="mt-4">
          <CustomizePanel
            widgets={widgets}
            onUpdate={handleUpdateWidgets}
            onClose={() => setShowCustomize(false)}
          />
        </div>
      )}

      <div className="mt-6 space-y-6">
        {/* Revenue + Quick Stats row */}
        {(widgetIds.includes("revenue") || widgetIds.includes("quick-stats")) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {widgetIds.includes("revenue") && renderWidget("revenue")}
            {widgetIds.includes("quick-stats") && renderWidget("quick-stats")}
          </div>
        )}

        {/* Email growth — full width */}
        {widgetIds.includes("email-growth") && renderWidget("email-growth")}

        {/* Recent Sales + Top Books row */}
        {(widgetIds.includes("recent-sales") || widgetIds.includes("top-books")) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {widgetIds.includes("recent-sales") && renderWidget("recent-sales")}
            {widgetIds.includes("top-books") && renderWidget("top-books")}
          </div>
        )}

        {/* Top Referrers — full width */}
        {widgetIds.includes("top-referrers") && renderWidget("top-referrers")}
      </div>
    </div>
  );
}
