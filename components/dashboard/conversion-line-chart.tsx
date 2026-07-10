"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TODAY_ISO } from "@/lib/store/booking-store";
import type { LineNotification } from "@/lib/data/types";

function weeksAgo(dateIso: string): number {
  const today = new Date(`${TODAY_ISO}T00:00:00`);
  const d = new Date(dateIso);
  const days = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(3, Math.floor(days / 7));
}

export function ConversionLineChart({ notifications }: { notifications: LineNotification[] }) {
  const coupons = notifications.filter((n) => n.kind === "broadcast-coupon");
  const buckets = [3, 2, 1, 0].map((weekIdx) => {
    const inWeek = coupons.filter((n) => weeksAgo(n.createdAt) === weekIdx);
    const clicked = inWeek.filter((n) => n.clickedCoupon).length;
    const converted = inWeek.filter((n) => n.ledToCheckIn).length;
    const rate = clicked === 0 ? 0 : Math.round((converted / clicked) * 1000) / 10;
    return { week: `Week ${4 - weekIdx}`, rate };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">LINE OA Conversion Rate</CardTitle>
        <CardDescription>Coupon click → QR check-in conversion, by week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={buckets} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-c)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--ink-muted)" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
                unit="%"
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-c)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ fill: "var(--accent)", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
