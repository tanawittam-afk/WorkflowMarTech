"use client";

import { Star } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BEV_BY_ID } from "../lib/domain";
import { type Metrics } from "../lib/metrics";
import { Card, SectionHeader } from "./primitives";

export const PIE_COLORS: Record<string, string> = {
  "Study Pod": "#0ea5e9",
  "Meeting Room": "#8b5cf6",
  "Creator Studio": "#f59e0b",
  "Event Space": "#10b981",
};

export function ServiceCharts({ m }: { m: Metrics }) {
  const totalPie = m.pieData.reduce((s, d) => s + d.value, 0);
  return (
    <Card className="flex h-full flex-col p-4">
      <SectionHeader
        icon={<Star className="h-4 w-4" />}
        title="Top Favorite Services & Beverages"
        subtitle="สัดส่วนประเภทห้องยอดฮิต + เครื่องดื่มขายดี 30 วัน (แยกตาม Persona)"
      />
      <div className="mt-2 grid flex-1 gap-2 sm:grid-cols-2">
        <div className="flex flex-col">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={m.pieData} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={3} strokeWidth={0}>
                  {m.pieData.map((d) => (
                    <Cell key={d.name} fill={PIE_COLORS[d.name] ?? "#a29e97"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value)} ครั้ง (${totalPie ? Math.round((Number(value) / totalPie) * 100) : 0}%)`,
                    String(name),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1 text-[11px] text-cdp-ink2">
            {m.pieData.map((d) => (
              <li key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[d.name] ?? "#a29e97" }} />
                  {d.name}
                </span>
                <span className="font-semibold text-cdp-ink">
                  {totalPie ? Math.round((d.value / totalPie) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col">
          <p className="mb-1 text-[11px] font-semibold text-cdp-ink3">เครื่องดื่มขายดี (แก้ว/30 วัน)</p>
          <div className="min-h-44 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.barData} layout="vertical" margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="#e7e5e1" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#57534e" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={104}
                  tick={{ fontSize: 10, fill: "#1c1917" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(value) => [`${Number(value)} แก้ว`, "ยอดสั่ง"]} />
                <Bar dataKey="qty" radius={[0, 4, 4, 0]}>
                  {m.barData.map((d) => {
                    const bev = BEV_BY_ID.get(d.bevId)!;
                    const fill = bev.personas.includes("student")
                      ? "#0ea5e9"
                      : bev.personas.includes("creator") && !bev.personas.includes("pro")
                        ? "#f59e0b"
                        : "#8b5cf6";
                    return <Cell key={d.bevId} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[10px] text-cdp-ink3">
            สี = Persona หลักที่สั่ง: ฟ้า นักศึกษา · ม่วง คนทำงาน · ส้ม ครีเอเตอร์
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ============================================================
   Dashboard — VIP churn risk table
   ============================================================ */

