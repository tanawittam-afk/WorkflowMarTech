"use client";

import { useState } from "react";
import { Coffee, GlassWater, Send, Sparkles } from "lucide-react";

import { type AppState } from "../lib/domain";
import { beverageInsight } from "../lib/insights";
import { type Metrics } from "../lib/metrics";
import { type Action } from "../lib/reducer";
import { AssociationRulesTable } from "../components/association-rules-table";
import { BundlePanel } from "../components/bundle-panel";
import { InsightStrip } from "../components/insight-strip";
import { KpiTile } from "../components/kpi-tile";
import { fmtBaht, fmtPct } from "../components/primitives";
import { RecommendationCards } from "../components/recommendation-cards";
import { ServiceCharts } from "../components/service-charts";
import { StaggerGrid } from "../components/stagger-grid";

type SubView = "association" | "bundles";

/**
 * Split below the always-visible KPIs + charts into two segments instead of
 * stacking Association Rules + Recommendations + Bundle Panel on top of
 * each other — this page was the most cluttered of the five (6 blocks
 * scrolling straight down); the segmented control halves that.
 */
export function BeverageCampaign({ state, m, dispatch }: { state: AppState; m: Metrics; dispatch: React.Dispatch<Action> }) {
  const [sub, setSub] = useState<SubView>("association");
  const insight = beverageInsight(m);
  const avgBevSpend = m.bookingCount30 === 0 ? 0 : m.bevRev30 / m.bookingCount30;

  return (
    <div className="space-y-4">
      <StaggerGrid className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile
          icon={<GlassWater className="h-3.5 w-3.5" />}
          label="Beverage Attach Rate"
          value={m.attach30}
          format={(n) => fmtPct(n, 0)}
          tone={m.attach30 < 32 ? "warn" : "good"}
        />
        <KpiTile icon={<Coffee className="h-3.5 w-3.5" />} label="Avg Beverage Spend" value={avgBevSpend} format={fmtBaht} hint="ต่อการจอง" />
        <KpiTile icon={<Send className="h-3.5 w-3.5" />} label="Campaign Conversion" value={m.lineConversion} format={(n) => fmtPct(n, 0)} hint="LINE OA Coupon" />
        <KpiTile icon={<Sparkles className="h-3.5 w-3.5" />} label="Top Bundle" value={0} format={() => m.topService} hint="ประเภทห้องยอดฮิต" />
      </StaggerGrid>

      <div>
        <ServiceCharts m={m} />
        <InsightStrip insight={insight} />
      </div>

      <div className="inline-flex rounded-lg border border-cdp-border bg-cdp-surface-2 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setSub("association")}
          className={`rounded-md px-3 py-1.5 transition-colors ${
            sub === "association" ? "bg-cdp-surface text-cdp-ink shadow-[var(--cdp-shadow-card)]" : "text-cdp-ink2 hover:text-cdp-ink"
          }`}
        >
          Association & Recommendations
        </button>
        <button
          type="button"
          onClick={() => setSub("bundles")}
          className={`rounded-md px-3 py-1.5 transition-colors ${
            sub === "bundles" ? "bg-cdp-surface text-cdp-ink shadow-[var(--cdp-shadow-card)]" : "text-cdp-ink2 hover:text-cdp-ink"
          }`}
        >
          Active Bundles
        </button>
      </div>

      {sub === "association" ? (
        <div className="space-y-4">
          <AssociationRulesTable />
          <RecommendationCards state={state} />
        </div>
      ) : (
        <BundlePanel state={state} dispatch={dispatch} />
      )}
    </div>
  );
}
