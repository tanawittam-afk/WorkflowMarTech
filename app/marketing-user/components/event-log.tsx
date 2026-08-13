"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity } from "lucide-react";

import { type AppEvent } from "../lib/domain";
import { Card, SectionHeader } from "./primitives";

export function EventLog({ events }: { events: AppEvent[] }) {
  if (events.length === 0) return null;
  const toneClass: Record<AppEvent["tone"], string> = {
    success: "bg-emerald-500",
    info: "bg-cdp-accent",
    warn: "bg-amber-500",
  };
  return (
    <Card className="p-4">
      <SectionHeader icon={<Activity className="h-4 w-4" />} title="Activity Log" subtitle="เหตุการณ์ล่าสุดในเซสชันนี้" />
      <ul className="mt-3 space-y-1.5">
        <AnimatePresence initial={false}>
          {events.map((e) => (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 text-xs text-cdp-ink2"
            >
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${toneClass[e.tone]}`} />
              <span>{e.text}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Card>
  );
}

/* ============================================================
   Customer Booking Simulator
   ============================================================ */

