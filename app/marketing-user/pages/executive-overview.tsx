"use client";

import { AlertTriangle, Banknote, CheckCircle2, Coffee, Target, TrendingUp } from "lucide-react";

import { StaggerGrid } from "../components/stagger-grid";

import { regressionForecast, rfmTiers, SALES_GROWTH_TARGET_PCT } from "../lib/analytics-v2";
import { type AppState } from "../lib/domain";
import { type Metrics } from "../lib/metrics";
import { resolveScenario } from "../lib/scenarios";
import { AnalyticsLadder } from "../components/analytics-ladder";
import { DataSourcesStrip } from "../components/data-sources-strip";
import { ForecastChart } from "../components/forecast-chart";
import { KpiTile } from "../components/kpi-tile";
import { MarketingQuestionsPanel } from "../components/marketing-questions-panel";
import { Card, fmtBaht, fmtPct, SectionHeader } from "../components/primitives";

const TONE_STYLE = {
  good: { text: "text-cdp-good", bg: "bg-cdp-good-soft", ring: "ring-cdp-good/25", icon: CheckCircle2 },
  warn: { text: "text-cdp-warn", bg: "bg-cdp-warn-soft", ring: "ring-cdp-warn/25", icon: AlertTriangle },
  bad: { text: "text-cdp-bad", bg: "bg-cdp-bad-soft", ring: "ring-cdp-bad/25", icon: AlertTriangle },
} as const;

/**
 * Page 1 — the one page the business owner needs. Deliberately minimal: the
 * Main KPI, its four drivers, the forecast chart, and a single scenario
 * verdict with a link to drill down. Nothing else belongs here.
 */
export function ExecutiveOverview({
  state,
  m,
  onNavigate,
}: {
  state: AppState;
  m: Metrics;
  onNavigate: (view: "exec" | "space" | "customer" | "beverage") => void;
}) {
  const reg = regressionForecast(state);
  const rfm = rfmTiers(state);
  const scenario = resolveScenario(reg, m, rfm);
  const onTarget = reg.gapPts <= 0;
  const style = TONE_STYLE[scenario.tone];
  const ToneIcon = style.icon;

  const goToPage: Record<typeof scenario.id, "space" | "customer" | "beverage" | null> = {
    A: null,
    B: "space",
    C: "beverage",
    D: "customer",
    E: "space",
  };

  return (
    <div className="space-y-4">
      {/* Hero */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cdp-ink3">
              Total Sales Growth · เป้าหมาย +{SALES_GROWTH_TARGET_PCT}% ใน 6 เดือน
            </p>
            <p
              className={`mt-1 text-5xl font-bold tabular-nums ${onTarget ? "text-cdp-good" : "text-cdp-ink"}`}
              style={{ fontFamily: "var(--font-bricolage), var(--font-anuphan), sans-serif" }}
            >
              {reg.actualGrowthPct >= 0 ? "+" : ""}
              {reg.actualGrowthPct.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-cdp-ink3">
              เทียบก่อนเริ่ม CDP · พยากรณ์ 6 เดือนข้างหน้า{" "}
              <span className="font-semibold text-cdp-ink2">{reg.forecastGrowthPct.toFixed(1)}%</span>
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ring-1 ${style.bg} ${style.ring}`}>
            <ToneIcon className={`h-5 w-5 ${style.text}`} />
            <div>
              <p className={`text-sm font-bold ${style.text}`}>
                {onTarget ? "ถึงเป้าตามกำหนด" : `ต่ำกว่าเป้า ${reg.gapPts.toFixed(1)} จุด`}
              </p>
              <p className="text-[11px] text-cdp-ink3">{scenario.label}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Driver tiles */}
      <StaggerGrid className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile icon={<Banknote className="h-3.5 w-3.5" />} label="Room Revenue" value={m.roomRev30} format={fmtBaht} hint="30 วันล่าสุด" />
        <KpiTile icon={<Coffee className="h-3.5 w-3.5" />} label="Beverage Revenue" value={m.bevRev30} format={fmtBaht} hint="30 วันล่าสุด" />
        <KpiTile icon={<Target className="h-3.5 w-3.5" />} label="Combined AOV" value={m.aov30} format={fmtBaht} hint="เฉลี่ยต่อการจอง" />
        <KpiTile
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Sales Forecast"
          value={reg.forecastGrowthPct}
          format={(n) => fmtPct(n)}
          hint="6 เดือนข้างหน้า"
          tone={onTarget ? "good" : "warn"}
        />
      </StaggerGrid>

      <ForecastChart reg={reg} />

      {/* Scenario verdict */}
      <Card className={`p-4 ring-1 ${style.ring}`}>
        <SectionHeader
          icon={<ToneIcon className={`h-4 w-4 ${style.text}`} />}
          title={scenario.headline}
          subtitle={scenario.detail}
        />
        {goToPage[scenario.id] ? (
          <button
            type="button"
            onClick={() => onNavigate(goToPage[scenario.id]!)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-cdp-accent px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-cdp-accent-strong"
          >
            {scenario.actionLabel}
          </button>
        ) : null}
      </Card>

      <AnalyticsLadder reg={reg} scenario={scenario} />
      <DataSourcesStrip />
      <MarketingQuestionsPanel onNavigate={onNavigate} />
    </div>
  );
}
