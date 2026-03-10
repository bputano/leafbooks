"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface EmailGrowthChartProps {
  data: { month: string; subscribers: number }[];
}

export function EmailGrowthChart({ data }: EmailGrowthChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="rounded-xl border border-[rgba(44,40,37,0.08)] bg-white p-6 shadow-warm-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-base text-ink">Email List Growth</h2>
        <Link
          href="/grow"
          className="flex items-center gap-1 text-xs font-medium text-leaf-700 hover:text-leaf-800"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="mt-4 h-56">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,40,37,0.06)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#9C9590" }}
                axisLine={{ stroke: "rgba(44,40,37,0.08)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#9C9590" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid rgba(44,40,37,0.08)",
                  boxShadow: "0 4px 12px rgba(44,40,37,0.08)",
                  fontSize: "13px",
                }}
              />
              <Area
                type="monotone"
                dataKey="subscribers"
                stroke="#3D7A4A"
                fill="rgba(61,122,74,0.1)"
                strokeWidth={2}
                dot={{ r: 3, fill: "#3D7A4A" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">
            Loading chart...
          </div>
        )}
      </div>
    </div>
  );
}
