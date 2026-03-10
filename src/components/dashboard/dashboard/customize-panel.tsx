"use client";

import { ChevronUp, ChevronDown, X } from "lucide-react";

const WIDGET_LABELS: Record<string, string> = {
  revenue: "Revenue Overview",
  "quick-stats": "Quick Stats",
  "email-growth": "Email List Growth",
  "recent-sales": "Recent Sales",
  "top-books": "Top Books",
  "top-referrers": "Top Referrers",
};

interface WidgetConfig {
  id: string;
  visible: boolean;
  order: number;
}

interface CustomizePanelProps {
  widgets: WidgetConfig[];
  onUpdate: (widgets: WidgetConfig[]) => void;
  onClose: () => void;
}

export function CustomizePanel({ widgets, onUpdate, onClose }: CustomizePanelProps) {
  const sorted = [...widgets].sort((a, b) => a.order - b.order);

  const toggle = (id: string) => {
    onUpdate(
      widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const move = (id: string, direction: "up" | "down") => {
    const idx = sorted.findIndex((w) => w.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const updated = sorted.map((w, i) => {
      if (i === idx) return { ...w, order: swapIdx };
      if (i === swapIdx) return { ...w, order: idx };
      return { ...w, order: i };
    });
    onUpdate(updated);
  };

  return (
    <div className="rounded-xl border border-[rgba(44,40,37,0.08)] bg-white p-4 shadow-warm-md">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Customize Dashboard</h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-ink-muted hover:bg-paper-warm"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 space-y-1.5">
        {sorted.map((widget, idx) => (
          <div
            key={widget.id}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-paper-warm"
          >
            <label className="flex flex-1 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={widget.visible}
                onChange={() => toggle(widget.id)}
                className="h-4 w-4 rounded border-gray-300 text-leaf-600 focus:ring-leaf-500"
              />
              <span className="text-sm text-ink">
                {WIDGET_LABELS[widget.id] ?? widget.id}
              </span>
            </label>
            <div className="flex gap-0.5">
              <button
                onClick={() => move(widget.id, "up")}
                disabled={idx === 0}
                className="rounded p-0.5 text-ink-muted hover:bg-paper disabled:opacity-30"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => move(widget.id, "down")}
                disabled={idx === sorted.length - 1}
                className="rounded p-0.5 text-ink-muted hover:bg-paper disabled:opacity-30"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
