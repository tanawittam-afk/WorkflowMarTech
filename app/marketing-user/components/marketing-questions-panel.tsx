"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

import { MARKETING_QUESTIONS } from "../lib/marketing-questions";
import { Card, SectionHeader } from "./primitives";

/**
 * Proposal_V2 §1.2 — 8-dimension Marketing Questions reference (4P + CX /
 * Loyalty / Revenue & Profitability). Collapsed by default so it doesn't
 * compete with the live numbers above it; each row deep-links to the page
 * that answers it.
 */
export function MarketingQuestionsPanel({
  onNavigate,
}: {
  onNavigate: (view: "exec" | "space" | "customer" | "beverage") => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <SectionHeader
          icon={<HelpCircle className="h-4 w-4 text-cdp-accent" />}
          title="ตอบคำถามการตลาด 8 มิติ"
          subtitle="4P + Customer Experience + Customer Loyalty + Revenue & Profitability"
        />
        <ChevronDown className={`h-4 w-4 shrink-0 text-cdp-ink3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="mt-3 divide-y divide-cdp-border border-t border-cdp-border">
          {MARKETING_QUESTIONS.map((q) => (
            <button
              key={q.dimension}
              type="button"
              onClick={() => onNavigate(q.page)}
              className="flex w-full items-start justify-between gap-3 py-2.5 text-left transition-colors hover:bg-cdp-surface-2"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-cdp-accent">{q.dimension}</p>
                <p className="mt-0.5 text-xs text-cdp-ink2">{q.question}</p>
              </div>
              <span className="mt-0.5 shrink-0 rounded-full border border-cdp-border bg-cdp-surface-2 px-2 py-0.5 text-[10px] font-medium text-cdp-ink3">
                {q.pageLabel}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
