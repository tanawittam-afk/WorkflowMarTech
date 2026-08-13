"use client";

import { HeartPulse, Repeat, ShieldAlert, Users } from "lucide-react";

import { rfmTiers } from "../lib/analytics-v2";
import { type AppState } from "../lib/domain";
import { rfmInsight } from "../lib/insights";
import { type Metrics } from "../lib/metrics";
import { type Action } from "../lib/reducer";
import { InsightStrip } from "../components/insight-strip";
import { KpiTile } from "../components/kpi-tile";
import { fmtInt, fmtPct } from "../components/primitives";
import { RfmTable } from "../components/rfm-table";
import { SegmentScatter } from "../components/segment-scatter";

export function CustomerLoyalty({ state, m, dispatch }: { state: AppState; m: Metrics; dispatch: React.Dispatch<Action> }) {
  const rfm = rfmTiers(state);
  const atRiskCount = rfm.filter((r) => r.tier === "At-Risk").length;
  const insight = rfmInsight(rfm);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile icon={<Users className="h-3.5 w-3.5" />} label="Active Customers" value={m.activeCount} format={fmtInt} hint={`จากทั้งหมด ${m.totalCustomers} คน`} />
        <KpiTile icon={<Repeat className="h-3.5 w-3.5" />} label="Repeat Booking Rate" value={m.repeatRate} format={(n) => fmtPct(n, 0)} />
        <KpiTile
          icon={<ShieldAlert className="h-3.5 w-3.5" />}
          label="At-Risk Customers"
          value={atRiskCount}
          format={fmtInt}
          tone={atRiskCount >= 4 ? "bad" : "neutral"}
        />
        <KpiTile icon={<HeartPulse className="h-3.5 w-3.5" />} label="CSAT" value={m.csat} format={(n) => n.toFixed(1)} hint="เต็ม 5" />
      </div>

      <SegmentScatter rows={rfm} />

      <div>
        <RfmTable rows={rfm} state={state} dispatch={dispatch} />
        <InsightStrip insight={insight} />
      </div>
    </div>
  );
}
