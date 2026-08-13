"use client";

import {
  Activity,
  Banknote,
  MessageCircleHeart,
  Sparkles,
  Star,
  ThermometerSun,
  UserRound,
  Users,
} from "lucide-react";

import { type Metrics } from "../lib/metrics";
import { Card, CountUp, fmtBaht, fmtInt, fmtPct } from "./primitives";

export function KpiGrid({ m }: { m: Metrics }) {
  const kpis: Array<{
    id: string;
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    sub: string;
  }> = [
    {
      id: "customers",
      icon: <Users className="h-4 w-4" />,
      label: "Total Customers",
      value: <CountUp value={m.totalCustomers} format={fmtInt} />,
      sub: "สมาชิก CDP ทั้งหมด (LINE UID)",
    },
    {
      id: "newreg",
      icon: <UserRound className="h-4 w-4" />,
      label: "New Registration Rate",
      value: <span>+9.4%</span>,
      sub: "สมัครใหม่ผ่าน LINE/เว็บ เดือนนี้ +14 คน",
    },
    {
      id: "active",
      icon: <Activity className="h-4 w-4" />,
      label: "Active & Repeat Rate",
      value: <CountUp value={m.repeatRate} format={(n) => fmtPct(n, 0)} />,
      sub: `ลูกค้า Active 30 วัน ${m.activeCount} คน กลับมาซ้ำ`,
    },
    {
      id: "occupancy",
      icon: <ThermometerSun className="h-4 w-4" />,
      label: "Space Occupancy Rate",
      value: <CountUp value={m.occupancy} format={(n) => fmtPct(n, 0)} />,
      sub: "ความหนาแน่นเฉลี่ยช่วงเวลาทำการ (20 ห้อง)",
    },
    {
      id: "aov",
      icon: <Banknote className="h-4 w-4" />,
      label: "Combined AOV",
      value: <CountUp value={m.aov30} format={fmtBaht} />,
      sub: "ค่าห้องรอบ 1 + บิลค่าน้ำรอบ 2 ต่อการจอง",
    },
    {
      id: "topservice",
      icon: <Star className="h-4 w-4" />,
      label: "Top Favorite Services",
      value: <span className="text-lg">{m.topService}</span>,
      sub: `ครองสัดส่วน ${fmtPct(m.topServiceShare, 0)} ของการจอง 30 วัน`,
    },
    {
      id: "lineconv",
      icon: <MessageCircleHeart className="h-4 w-4" />,
      label: "LINE OA Conversion Rate",
      value: <CountUp value={m.lineConversion} format={(n) => fmtPct(n, 0)} />,
      sub: "ส่งคูปองแล้วลูกค้ากลับมาจองซ้ำ",
    },
    {
      id: "csat",
      icon: <Sparkles className="h-4 w-4" />,
      label: "CSAT",
      value: <CountUp value={m.csat} format={(n) => n.toFixed(2)} />,
      sub: "คะแนนความพึงพอใจเฉลี่ยหลังเช็กเอาต์ (เต็ม 5)",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((k) => (
        <Card key={k.id} className="p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">{k.icon}</span>
            <p className="text-[11px] font-semibold uppercase tracking-wide">{k.label}</p>
          </div>
          <p
            className="mt-2 text-2xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-bricolage), var(--font-anuphan), sans-serif" }}
          >
            {k.value}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-slate-500">{k.sub}</p>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================
   Dashboard — occupancy heatmap + dynamic pricing toggle
   ============================================================ */

