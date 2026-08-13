"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { Card } from "./primitives";

/** Light CDP-themed twin of components/dashboard/metric-card.tsx, for Live Ops. */
export function MetricCard({
  label,
  value,
  delta,
  caption,
}: {
  label: string;
  value: string;
  delta?: number;
  caption?: string;
}) {
  return (
    <Card className="p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-cdp-ink3">{label}</span>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span
          className="text-2xl font-bold tabular-nums text-cdp-ink"
          style={{ fontFamily: "var(--font-bricolage), var(--font-anuphan), sans-serif" }}
        >
          {value}
        </span>
        {delta !== undefined ? (
          <span
            className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              delta >= 0 ? "bg-cdp-good-soft text-cdp-good" : "bg-cdp-bad-soft text-cdp-bad"
            }`}
          >
            {delta >= 0 ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        ) : null}
      </div>
      {caption ? <span className="mt-1.5 block text-xs text-cdp-ink3">{caption}</span> : null}
    </Card>
  );
}
