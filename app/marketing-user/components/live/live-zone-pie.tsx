"use client";

import { PieChart as PieIcon } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { Booking, Zone } from "@/lib/data/types";

import { Card, SectionHeader } from "../primitives";

const ZONE_COLORS: Record<string, string> = {
  "zone-small": "#db2777",
  "zone-medium": "#4f46e5",
  "zone-large": "#d97706",
};

/** Real-data twin of components/dashboard/zone-pie-chart.tsx, re-skinned to the CDP's light tokens. */
export function LiveZonePie({ bookings, zones }: { bookings: Booking[]; zones: Zone[] }) {
  const data = zones.map((zone) => ({
    name: zone.shortName,
    value: bookings.filter((b) => b.zoneId === zone.id && b.status !== "cancelled").length,
    zoneId: zone.id,
  }));

  return (
    <Card className="p-4">
      <SectionHeader icon={<PieIcon className="h-4 w-4" />} title="Top Favorite Services" subtitle="Booking distribution across zones" />
      <div className="mt-2 h-56 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.map((entry) => (
                <Cell key={entry.zoneId} fill={ZONE_COLORS[entry.zoneId]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e7e5e1", borderRadius: 10, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#57534e" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
