"use client";

import { Card, CountUp } from "./primitives";

/** One driver metric — the repeating unit of every page's top row. */
export function KpiTile({
  icon,
  label,
  value,
  format,
  hint,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  format: (n: number) => string;
  hint?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "bad"
          ? "text-red-600"
          : "text-slate-900";
  return (
    <Card className="p-3.5">
      <div className="flex items-center gap-2 text-slate-400">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50">{icon}</div>
        <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${toneClass}`} style={{ fontFamily: "var(--font-bricolage), var(--font-anuphan), sans-serif" }}>
        <CountUp value={value} format={format} />
      </p>
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
    </Card>
  );
}
