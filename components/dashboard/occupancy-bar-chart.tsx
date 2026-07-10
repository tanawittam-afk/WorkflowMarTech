"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Booking } from "@/lib/data/types";

function buildHourlyOccupancy(bookings: Booking[]) {
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8am - 10pm
  return hours.map((hour) => {
    const count = bookings.filter((b) => {
      if (b.status === "cancelled") return false;
      const startHour = parseInt(b.startTime.slice(0, 2), 10);
      const endHour = parseInt(b.endTime.slice(0, 2), 10);
      return hour >= startHour && hour < endHour;
    }).length;
    const label = hour === 12 ? "12PM" : hour > 12 ? `${hour - 12}PM` : `${hour}AM`;
    return { hour: label, bookings: count };
  });
}

export function OccupancyBarChart({ bookings }: { bookings: Booking[] }) {
  const data = buildHourlyOccupancy(bookings);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Peak Hours & Space Occupancy</CardTitle>
        <CardDescription>Bookings active per hour, across all zones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-c)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "var(--ink-muted)" }} interval={1} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-muted)" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-c)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="bookings" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
