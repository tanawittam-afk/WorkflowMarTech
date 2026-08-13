"use client";

/** Formatting helpers + the small shared UI atoms every dashboard page uses. */

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";

import { type Persona } from "../lib/domain";

export const fmtInt = (n: number) => Math.round(n).toLocaleString("th-TH");
export const fmtBaht = (n: number) => `฿${fmtInt(n)}`;
export const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

export const PERSONA_META: Record<Persona, { label: string; chip: string; dot: string }> = {
  student: { label: "นักศึกษา", chip: "bg-sky-50 text-sky-700 border-sky-200", dot: "#0ea5e9" },
  pro: { label: "คนทำงาน/ฟรีแลนซ์", chip: "bg-violet-50 text-violet-700 border-violet-200", dot: "#8b5cf6" },
  creator: { label: "ครีเอเตอร์", chip: "bg-amber-50 text-amber-700 border-amber-200", dot: "#f59e0b" },
};

export function PersonaChip({ persona }: { persona: Persona }) {
  const meta = PERSONA_META[persona];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.chip}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
      {meta.label}
    </span>
  );
}

/** Animated number that writes to textContent (no re-render churn). */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.textContent = format(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, format, reduced]);

  return <span ref={ref}>{format(value)}</span>;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  // min-w-0 lets Cards shrink inside grid tracks so wide content (heatmap,
  // tables) scrolls in its own overflow-x-auto container instead of
  // stretching the page on mobile.
  return (
    <div className={`min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
  );
}

export function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-900" style={{ fontFamily: "var(--font-bricolage), var(--font-anuphan), sans-serif" }}>
          {title}
        </h2>
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}

/* ============================================================
   Dashboard — goal bars
   ============================================================ */
