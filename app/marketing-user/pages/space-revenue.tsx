"use client";

import { Banknote, CalendarCheck, MoonStar, ThermometerSun } from "lucide-react";

import { type AppState } from "../lib/domain";
import { occupancyInsight } from "../lib/insights";
import { type Metrics } from "../lib/metrics";
import { InsightStrip } from "../components/insight-strip";
import { KpiTile } from "../components/kpi-tile";
import { OccupancyHeatmap } from "../components/occupancy-heatmap";
import { fmtBaht, fmtInt, fmtPct } from "../components/primitives";
import { type Action } from "../lib/reducer";

export function SpaceRevenue({ state, m, dispatch }: { state: AppState; m: Metrics; dispatch: React.Dispatch<Action> }) {
  const insight = occupancyInsight(m, state.dynamicPricing);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile icon={<CalendarCheck className="h-3.5 w-3.5" />} label="Booking Volume" value={m.bookingCount30} format={fmtInt} hint="30 วันล่าสุด" />
        <KpiTile
          icon={<ThermometerSun className="h-3.5 w-3.5" />}
          label="Occupancy Rate"
          value={m.occupancy}
          format={(n) => fmtPct(n, 0)}
          hint="เฉลี่ยทุกห้อง"
          tone={m.occupancy < 55 ? "warn" : "good"}
        />
        <KpiTile
          icon={<Banknote className="h-3.5 w-3.5" />}
          label="Avg Room Revenue/Booking"
          value={m.avgRoomRevPerBooking30}
          format={fmtBaht}
        />
        <KpiTile
          icon={<MoonStar className="h-3.5 w-3.5" />}
          label="Off-Peak Utilization"
          value={m.offPeakShare30}
          format={(n) => fmtPct(n, 0)}
          hint="สัดส่วนการจองช่วง 21:00–09:00"
        />
      </div>

      <div>
        <OccupancyHeatmap state={state} dispatch={dispatch} />
        <InsightStrip insight={insight} />
      </div>
    </div>
  );
}
