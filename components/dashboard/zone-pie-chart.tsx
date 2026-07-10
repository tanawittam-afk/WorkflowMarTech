"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Booking, Zone } from "@/lib/data/types";

const ZONE_COLORS: Record<string, string> = {
  "zone-1-studio": "var(--zone-studio)",
  "zone-2-coworking": "var(--zone-coworking)",
  "zone-3-cafe": "var(--zone-cafe)",
};

export function ZonePieChart({ bookings, zones }: { bookings: Booking[]; zones: Zone[] }) {
  const data = zones.map((zone) => ({
    name: zone.shortName,
    value: bookings.filter((b) => b.zoneId === zone.id && b.status !== "cancelled").length,
    zoneId: zone.id,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Favorite Services</CardTitle>
        <CardDescription>Booking distribution across zones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.map((entry) => (
                  <Cell key={entry.zoneId} fill={ZONE_COLORS[entry.zoneId]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-c)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-secondary)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
