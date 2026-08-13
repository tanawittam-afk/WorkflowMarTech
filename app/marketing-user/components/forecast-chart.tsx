"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SALES_GROWTH_TARGET_PCT, type RegressionResult } from "../lib/analytics-v2";
import { Card, SectionHeader } from "./primitives";

/** Page 1 hero chart — Actual (solid) vs Forecast (dashed) vs Target (line). */
export function ForecastChart({ reg }: { reg: RegressionResult }) {
  const data = reg.series.map((p) => ({
    month: p.month === 0 ? "เริ่ม CDP" : `เดือน ${p.month}`,
    actual: p.kind === "actual" ? p.growthPct : null,
    forecast: p.kind === "forecast" ? p.growthPct : p.month === 6 ? p.growthPct : null,
  }));

  return (
    <Card className="p-4">
      <SectionHeader
        icon={<span className="text-sm font-bold">%</span>}
        title="Total Sales Growth — Actual vs Forecast vs Target"
        subtitle="Multiple Regression Analysis: แนวโน้ม 6 เดือนที่ผ่านมา พยากรณ์ต่ออีก 6 เดือนข้างหน้า"
      />
      <div className="mt-2 h-56 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
              width={36}
            />
            <ReferenceLine
              y={SALES_GROWTH_TARGET_PCT}
              stroke="#16a34a"
              strokeDasharray="4 4"
              label={{ value: `เป้า +${SALES_GROWTH_TARGET_PCT}%`, position: "right", fontSize: 10, fill: "#16a34a" }}
            />
            <Tooltip
              formatter={(v) => [`${Number(v).toFixed(1)}%`, ""]}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
            />
            <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} connectNulls name="Actual" />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 3 }}
              connectNulls
              name="Forecast"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex items-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-blue-600" /> Actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded border-t-2 border-dashed border-blue-600" /> Forecast
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded border-t-2 border-dashed border-emerald-600" /> Target +{SALES_GROWTH_TARGET_PCT}%
        </span>
      </div>
    </Card>
  );
}
