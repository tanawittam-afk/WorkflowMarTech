"use client";

import { Users2 } from "lucide-react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

import { type RfmRow } from "../lib/analytics-v2";
import { Card, PERSONA_META, SectionHeader } from "./primitives";

/** V2 §4.4 — Customer Segmentation (K-Means): Frequency × Monetary, by persona. */
export function SegmentScatter({ rows }: { rows: RfmRow[] }) {
  const data = rows.map((r) => ({
    x: r.frequency90,
    y: r.monetary,
    name: r.name,
    persona: r.persona,
    tier: r.tier,
  }));

  return (
    <Card className="p-4">
      <SectionHeader
        icon={<Users2 className="h-4 w-4" />}
        title="Customer Segmentation — K-Means (Frequency × Monetary)"
        subtitle="แต่ละจุดคือลูกค้า 1 คน สีตาม Persona — กลุ่มที่จับตัวกันคือ Segment เดียวกัน"
      />
      <div className="mt-2 h-56 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="x"
              name="Frequency (90 วัน)"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Monetary"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <ZAxis range={[60, 60]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value, key) => [
                key === "y" ? `฿${Number(value).toLocaleString("th-TH")}` : String(value),
                key === "x" ? "Frequency" : "Monetary",
              ]}
              labelFormatter={() => ""}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
            />
            {(["student", "pro", "creator"] as const).map((persona) => (
              <Scatter
                key={persona}
                name={PERSONA_META[persona].label}
                data={data.filter((d) => d.persona === persona)}
                fill={PERSONA_META[persona].dot}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
        {(["student", "pro", "creator"] as const).map((persona) => (
          <span key={persona} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PERSONA_META[persona].dot }} />
            {PERSONA_META[persona].label}
          </span>
        ))}
      </div>
    </Card>
  );
}
