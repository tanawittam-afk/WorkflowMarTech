"use client";

import { Eye, Lightbulb, Search, TrendingUp } from "lucide-react";

import { type RegressionResult } from "../lib/analytics-v2";
import { type Scenario } from "../lib/scenarios";
import { Card, SectionHeader } from "./primitives";

/**
 * Proposal_V2 §6.3–6.4's Descriptive → Diagnostic → Predictive → Prescriptive
 * ladder, made explicit on screen. Every value here is already computed
 * elsewhere on this page (the hero number, the scenario verdict, the
 * forecast, the CTA) — this just re-labels them under the framework's own
 * four steps, the same shape `lib/insights.ts`'s Insight Strips already use.
 */
export function AnalyticsLadder({ reg, scenario }: { reg: RegressionResult; scenario: Scenario }) {
  const steps = [
    {
      icon: Eye,
      label: "Descriptive",
      question: "เกิดอะไรขึ้น?",
      answer: `Total Sales ตอนนี้ ${reg.actualGrowthPct >= 0 ? "+" : ""}${reg.actualGrowthPct.toFixed(1)}% เทียบก่อนเริ่ม CDP`,
    },
    {
      icon: Search,
      label: "Diagnostic",
      question: "ทำไมถึงเป็นแบบนี้?",
      answer: scenario.headline,
    },
    {
      icon: TrendingUp,
      label: "Predictive",
      question: "จะเป็นอย่างไรต่อ?",
      answer: `พยากรณ์ 6 เดือนข้างหน้า ${reg.forecastGrowthPct.toFixed(1)}% (${reg.gapPts <= 0 ? "ถึงเป้า" : `ขาดอีก ${reg.gapPts.toFixed(1)} จุด`})`,
    },
    {
      icon: Lightbulb,
      label: "Prescriptive",
      question: "ควรทำอะไร?",
      answer: scenario.actionLabel,
    },
  ] as const;

  return (
    <Card className="p-4">
      <SectionHeader
        icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
        title="Data Analytics 4 ระดับ"
        subtitle="จากข้อมูลดิบ สู่คำแนะนำที่ลงมือทำได้"
      />
      <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                  {idx + 1}
                </span>
                <Icon className="h-3 w-3" />
                {step.label}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">{step.question}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-800">{step.answer}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
