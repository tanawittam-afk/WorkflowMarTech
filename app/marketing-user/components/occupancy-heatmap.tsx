"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, ThermometerSun, Zap } from "lucide-react";

import {
  baseHeatFor,
  OFF_PEAK_DISCOUNT,
  OFF_PEAK_HOURS,
  priceFor,
  ROOMS,
  type AppState,
} from "../lib/domain";
import { type Action } from "../lib/reducer";
import { Card, fmtBaht, fmtInt, SectionHeader } from "./primitives";

export function heatColor(t: number): string {
  // green (vacant) → amber (filling) → red (peak)
  const stops: Array<[number, [number, number, number]]> = [
    [0, [220, 252, 231]], // green-100
    [0.45, [253, 230, 138]], // amber-200
    [0.75, [251, 146, 60]], // orange-400
    [1, [239, 68, 68]], // red-500
  ];
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const span = hi[0] - lo[0] || 1;
  const f = (t - lo[0]) / span;
  const rgb = lo[1].map((c, i) => Math.round(c + (hi[1][i] - c) * f));
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

export function OccupancyHeatmap({
  state,
  dispatch,
}: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}) {
  // Cells booked today via the simulator get a distinct blue overlay.
  const newCells = useMemo(() => {
    const set = new Set<string>();
    for (const b of state.bookings) {
      if (!b.isNew) continue;
      for (let h = b.hour; h < Math.min(24, b.hour + b.duration); h++) set.add(`${b.roomId}:${h}`);
    }
    return set;
  }, [state.bookings]);

  const pendingPricing = state.proposals.some((p) => p.status === "pending" && p.payload.kind === "pricing");

  const handleToggle = () => {
    if (state.dynamicPricing) {
      // Turning a live discount off doesn't need sign-off — only spending money does.
      dispatch({ type: "toggleDynamicPricing" });
      return;
    }
    if (pendingPricing) return;
    dispatch({
      type: "propose",
      proposal: {
        title: "เปิด Dynamic Pricing ช่วง Off-Peak (-18%)",
        type: "pricing",
        detail: "ลดราคาห้องอัตโนมัติในช่วง 21:00–09:00 บนหน้าเว็บจองหลัก ทุกห้อง",
        targetCount: ROOMS.length,
        discountPct: Math.round(OFF_PEAK_DISCOUNT * 100),
        estRevenueLift: Math.round(ROOMS.reduce((s, r) => s + r.rate, 0) * 0.35),
        payload: { kind: "pricing" },
      },
    });
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          icon={<ThermometerSun className="h-4 w-4" />}
          title="Occupancy Heatmap — 20 ห้อง × 24 ชั่วโมง"
          subtitle="ผลพยากรณ์ความหนาแน่นจากโมเดล Time-Series Forecasting (เขียว = ว่าง, แดง = แน่น)"
        />
        <button
          type="button"
          onClick={handleToggle}
          disabled={pendingPricing}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
            state.dynamicPricing
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
          aria-pressed={state.dynamicPricing}
        >
          {pendingPricing ? (
            <>
              <Clock className="h-3.5 w-3.5" />
              รออนุมัติ
            </>
          ) : (
            <>
              <span
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                  state.dynamicPricing ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute h-3 w-3 rounded-full bg-white shadow transition-transform ${
                    state.dynamicPricing ? "translate-x-3.5" : "translate-x-0.5"
                  }`}
                />
              </span>
              <Zap className="h-3.5 w-3.5" />
              Dynamic Pricing {state.dynamicPricing ? "ON" : "OFF"}
            </>
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {state.dynamicPricing ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                ระบบราคาอัตโนมัติทำงานอยู่ — ห้องในช่วง <b>Off-Peak (21:00–09:00)</b> ถูกปรับลดราคา{" "}
                <b>18%</b> บนหน้าเว็บจองหลักแล้ว (เช่น Study Pod ฿300 → ฿{fmtInt(300 * (1 - OFF_PEAK_DISCOUNT))}/ชม.)
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-3 overflow-x-auto pb-1">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[88px_repeat(24,1fr)] gap-[3px] text-[9px] text-slate-400">
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-center tabular-nums">
                {h % 3 === 0 ? `${String(h).padStart(2, "0")}` : ""}
              </div>
            ))}
          </div>
          {ROOMS.map((room) => (
            <div key={room.id} className="mt-[3px] grid grid-cols-[88px_repeat(24,1fr)] gap-[3px]">
              <div className="flex items-center truncate pr-1 text-[10px] font-medium text-slate-600">
                {room.name}
              </div>
              {Array.from({ length: 24 }, (_, h) => {
                const isNew = newCells.has(`${room.id}:${h}`);
                const discounted = state.dynamicPricing && OFF_PEAK_HOURS.has(h);
                return (
                  <div
                    key={h}
                    title={`${room.name} · ${String(h).padStart(2, "0")}:00 · ${
                      isNew ? "จองใหม่ (Simulator)" : `ความหนาแน่น ${Math.round(baseHeatFor(room, h) * 100)}%`
                    }${discounted ? ` · Off-Peak -18% → ${fmtBaht(priceFor(room, h, true))}/ชม.` : ""}`}
                    className={`h-3.5 rounded-[3px] ${isNew ? "ring-2 ring-blue-600 ring-offset-[0.5px]" : ""} ${
                      discounted && !isNew ? "outline outline-1 -outline-offset-1 outline-emerald-500/60" : ""
                    }`}
                    style={{ backgroundColor: isNew ? "#2563eb" : heatColor(baseHeatFor(room, h)) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: heatColor(0.1) }} /> ว่าง / Off-Peak
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: heatColor(0.55) }} /> เริ่มแน่น
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: heatColor(0.95) }} /> Peak / แน่นมาก
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-blue-600" /> จองใหม่จาก Simulator
        </span>
        {state.dynamicPricing ? (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] outline outline-1 -outline-offset-1 outline-emerald-500" />{" "}
            ช่วงที่ลดราคาอยู่
          </span>
        ) : null}
      </div>
    </Card>
  );
}

/* ============================================================
   Dashboard — service & beverage charts
   ============================================================ */

