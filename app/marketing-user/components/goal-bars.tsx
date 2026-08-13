"use client";

import { motion } from "framer-motion";
import { Banknote, CupSoda, TrendingUp } from "lucide-react";

import { BASELINES, goalProgress, type Metrics } from "../lib/metrics";
import { Card, fmtBaht, fmtPct } from "./primitives";

export function GoalBars({ m }: { m: Metrics }) {
  const goals = [
    {
      id: "g1",
      icon: <Banknote className="h-4 w-4" />,
      title: "เป้า 1 · ยอดจองห้อง +15% ใน 6 เดือน",
      currentLabel: `${fmtBaht(m.roomRev30)} /30 วัน`,
      targetLabel: `เป้า ${fmtBaht(Math.round(BASELINES.revenue * 1.15))}`,
      progress: goalProgress(m.roomRev30, BASELINES.revenue, BASELINES.revenue * 1.15),
      bar: "bg-blue-600",
    },
    {
      id: "g2",
      icon: <CupSoda className="h-4 w-4" />,
      title: "เป้า 2 · Beverage Attach Rate → 40%",
      currentLabel: `ปัจจุบัน ${fmtPct(m.attach30)}`,
      targetLabel: "เป้า 40%",
      progress: goalProgress(m.attach30, BASELINES.attach, 40),
      bar: "bg-emerald-600",
    },
    {
      id: "g3",
      icon: <TrendingUp className="h-4 w-4" />,
      title: "เป้า 3 · AOV รวม (ค่าห้อง+ค่าน้ำ) +15%",
      currentLabel: `${fmtBaht(m.aov30)} /บิล`,
      targetLabel: `เป้า ${fmtBaht(Math.round(BASELINES.aov * 1.15))}`,
      progress: goalProgress(m.aov30, BASELINES.aov, BASELINES.aov * 1.15),
      bar: "bg-violet-600",
    },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {goals.map((g) => (
        <Card key={g.id} className="p-4">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600">{g.icon}</span>
            <p className="text-xs font-semibold">{g.title}</p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className={`h-full rounded-full ${g.bar}`}
              initial={false}
              animate={{ width: `${g.progress}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-700">{g.currentLabel}</span>
            <span className="text-slate-400">{g.targetLabel}</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            ความคืบหน้า <span className="font-bold text-slate-800">{fmtPct(g.progress, 0)}</span> ของเป้าหมาย
          </p>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================
   Dashboard — 8 core KPI cards
   ============================================================ */

