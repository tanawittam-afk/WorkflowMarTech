"use client";

import { Sparkles } from "lucide-react";

import { recommendFor, type Recommendation } from "../lib/analytics-v2";
import { type AppState, type Persona } from "../lib/domain";
import { Card, fmtBaht, PERSONA_META, SectionHeader } from "./primitives";

const PERSONAS: Persona[] = ["student", "pro", "creator"];

/** V2 §4.6 — Recommendation System: top beverage picks per persona segment. */
export function RecommendationCards({ state }: { state: AppState }) {
  return (
    <Card className="p-4">
      <SectionHeader
        icon={<Sparkles className="h-4 w-4" />}
        title="Recommendation System — แนะนำเครื่องดื่มตามกลุ่มลูกค้า"
        subtitle="Rule/Content-based: ให้คะแนนจาก Association Rules Lift + สินค้าที่กลุ่มนั้นยังสั่งน้อย"
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {PERSONAS.map((persona) => {
          const recs: Recommendation[] = recommendFor({ persona }, state, 2);
          const meta = PERSONA_META[persona];
          return (
            <div key={persona} className="rounded-lg border border-cdp-border bg-cdp-surface-2/60 p-3">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.chip}`}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
                {meta.label}
              </span>
              <div className="mt-2 space-y-2">
                {recs.map((r) => (
                  <div key={r.bevId} className="rounded-md bg-cdp-surface p-2 ring-1 ring-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-cdp-ink">{r.name}</p>
                      <p className="text-xs font-semibold tabular-nums text-cdp-ink3">{fmtBaht(r.price)}</p>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-snug text-cdp-ink3">{r.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
