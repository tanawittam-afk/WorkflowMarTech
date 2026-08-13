"use client";

import { ArrowRight, Lightbulb } from "lucide-react";

import { type Insight } from "../lib/insights";

/**
 * Fixed 3-line strip under every chart/table: read → meaning → action. This
 * is where Descriptive→Diagnostic→Predictive→Prescriptive actually shows up
 * on screen — no framework label, just the sentence a marketer needs.
 */
export function InsightStrip({ insight, onAction, actionLabel }: { insight: Insight; onAction?: () => void; actionLabel?: string }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg border border-cdp-accent/15 bg-cdp-accent-soft/60 px-3 py-2.5 text-xs text-cdp-ink2">
      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cdp-accent" />
      <div className="space-y-1">
        <p>
          <span className="font-semibold text-cdp-ink">อ่านค่านี้:</span> {insight.read}
        </p>
        <p>
          <span className="font-semibold text-cdp-ink">แปลว่า:</span> {insight.meaning}
        </p>
        <p className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-cdp-ink">ควรทำ:</span> {insight.action}
          {onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1 rounded-md bg-cdp-accent px-2 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-cdp-accent-strong"
            >
              {actionLabel ?? "ส่งอนุมัติ"}
              <ArrowRight className="h-3 w-3" />
            </button>
          ) : null}
        </p>
      </div>
    </div>
  );
}
