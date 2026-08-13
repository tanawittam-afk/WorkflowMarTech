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
      ? "text-cdp-good"
      : tone === "warn"
        ? "text-cdp-warn"
        : tone === "bad"
          ? "text-cdp-bad"
          : "text-cdp-ink";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-cdp-ink3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cdp-surface-2">{icon}</div>
        <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p
        className={`mt-2.5 text-2xl font-bold tabular-nums ${toneClass}`}
        style={{ fontFamily: "var(--font-bricolage), var(--font-anuphan), sans-serif" }}
      >
        <CountUp value={value} format={format} />
      </p>
      {hint ? <p className="mt-1.5 text-xs text-cdp-ink3">{hint}</p> : null}
    </Card>
  );
}
