"use client";

import { useMemo } from "react";
import { Flame, Zap } from "lucide-react";

import { HOUR_OPTIONS, OFF_PEAK_DISCOUNT, OFF_PEAK_HOURS } from "@/lib/booking-helpers";
import { TODAY_ISO, useBookingStore } from "@/lib/store/booking-store";
import type { Booking, Room } from "@/lib/data/types";

import { Card, SectionHeader } from "../primitives";

// green -> amber -> orange -> red, tuned for the CDP's warm light surface.
const HEAT_STOPS: Array<[number, [number, number, number]]> = [
  [0, [245, 244, 241]],
  [0.4, [251, 191, 36]],
  [0.7, [249, 115, 22]],
  [1, [220, 38, 38]],
];

function heatColor(t: number): string {
  let lo = HEAT_STOPS[0];
  let hi = HEAT_STOPS[HEAT_STOPS.length - 1];
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    if (t >= HEAT_STOPS[i][0] && t <= HEAT_STOPS[i + 1][0]) {
      lo = HEAT_STOPS[i];
      hi = HEAT_STOPS[i + 1];
      break;
    }
  }
  const span = hi[0] - lo[0] || 1;
  const f = (t - lo[0]) / span;
  const rgb = lo[1].map((c, i) => Math.round(c + (hi[1][i] - c) * f));
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

/** Real-data twin of components/dashboard/occupancy-heatmap.tsx, re-skinned to the CDP's light tokens. */
export function LiveOccupancyHeatmap({ bookings, rooms }: { bookings: Booking[]; rooms: Room[] }) {
  const dynamicPricing = useBookingStore((s) => s.dynamicPricing);
  const toggleDynamicPricing = useBookingStore((s) => s.toggleDynamicPricing);

  const { cellCounts, todayCells, maxCount } = useMemo(() => {
    const counts = new Map<string, number>();
    const today = new Set<string>();
    let max = 0;
    for (const b of bookings) {
      if (b.status === "cancelled") continue;
      const start = parseInt(b.startTime.slice(0, 2), 10);
      const end = parseInt(b.endTime.slice(0, 2), 10);
      for (let h = start; h < end; h++) {
        if (!HOUR_OPTIONS.includes(h)) continue;
        const key = `${b.roomId}:${h}`;
        const next = (counts.get(key) ?? 0) + 1;
        counts.set(key, next);
        if (next > max) max = next;
        if (b.date === TODAY_ISO) today.add(key);
      }
    }
    return { cellCounts: counts, todayCells: today, maxCount: max || 1 };
  }, [bookings]);

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          icon={<Flame className="h-4 w-4" />}
          title="Occupancy Heatmap"
          subtitle={`${rooms.length} rooms × ${HOUR_OPTIONS.length} operating hours — booking density from historical demand`}
        />
        <button
          type="button"
          onClick={toggleDynamicPricing}
          aria-pressed={dynamicPricing}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            dynamicPricing ? "border-cdp-good/30 bg-cdp-good-soft text-cdp-good" : "border-cdp-border bg-cdp-surface text-cdp-ink2 hover:bg-cdp-surface-2"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          Dynamic Pricing {dynamicPricing ? "ON" : "OFF"}
        </button>
      </div>
      {dynamicPricing ? (
        <p className="mt-3 rounded-lg bg-cdp-good-soft px-3 py-2 text-xs text-cdp-good">
          Off-peak hours ({[...OFF_PEAK_HOURS].sort((a, b) => a - b).map((h) => `${h}:00`).join(", ")}) are now
          discounted {Math.round(OFF_PEAK_DISCOUNT * 100)}% on the booking page.
        </p>
      ) : null}

      <div className="mt-3 overflow-x-auto pb-1">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[100px_repeat(13,1fr)] gap-[3px] text-[10px] text-cdp-ink3">
            <div />
            {HOUR_OPTIONS.map((h) => (
              <div key={h} className="text-center tabular-nums">
                {h}
              </div>
            ))}
          </div>
          {rooms.map((room) => (
            <div key={room.id} className="mt-[3px] grid grid-cols-[100px_repeat(13,1fr)] gap-[3px]">
              <div className="flex items-center truncate pr-1 text-[11px] font-medium text-cdp-ink2">{room.name}</div>
              {HOUR_OPTIONS.map((h) => {
                const key = `${room.id}:${h}`;
                const count = cellCounts.get(key) ?? 0;
                const isToday = todayCells.has(key);
                const discounted = dynamicPricing && OFF_PEAK_HOURS.has(h);
                return (
                  <div
                    key={h}
                    title={`${room.name} · ${h}:00 · ${count} historical booking${count === 1 ? "" : "s"}${
                      discounted ? ` · Off-Peak -${Math.round(OFF_PEAK_DISCOUNT * 100)}%` : ""
                    }`}
                    className={`h-4 rounded-[3px] ${isToday ? "ring-2 ring-inset ring-cdp-accent" : ""} ${
                      discounted && !isToday ? "outline outline-1 -outline-offset-1 outline-cdp-good/60" : ""
                    }`}
                    style={{ backgroundColor: heatColor(count / maxCount) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-cdp-ink3">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: heatColor(0.05) }} /> Low demand
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: heatColor(1) }} /> Peak demand
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] ring-2 ring-cdp-accent" /> Booked today
        </span>
      </div>
    </Card>
  );
}
