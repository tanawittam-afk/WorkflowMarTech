"use client";

import { Send } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { TODAY_ISO } from "@/lib/store/booking-store";
import type { LineNotification } from "@/lib/data/types";

import { Card, SectionHeader } from "../primitives";

function weeksAgo(dateIso: string): number {
  const today = new Date(`${TODAY_ISO}T00:00:00`);
  const d = new Date(dateIso);
  const days = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(3, Math.floor(days / 7));
}

/** Real-data twin of components/dashboard/conversion-line-chart.tsx, re-skinned to the CDP's light tokens. */
export function LiveConversionChart({ notifications }: { notifications: LineNotification[] }) {
  const coupons = notifications.filter((n) => n.kind === "broadcast-coupon");
  const buckets = [3, 2, 1, 0].map((weekIdx) => {
    const inWeek = coupons.filter((n) => weeksAgo(n.createdAt) === weekIdx);
    const clicked = inWeek.filter((n) => n.clickedCoupon).length;
    const converted = inWeek.filter((n) => n.ledToCheckIn).length;
    const rate = clicked === 0 ? 0 : Math.round((converted / clicked) * 1000) / 10;
    return { week: `Week ${4 - weekIdx}`, rate };
  });

  return (
    <Card className="p-4">
      <SectionHeader icon={<Send className="h-4 w-4" />} title="LINE OA Conversion Rate" subtitle="Coupon click → QR check-in conversion, by week" />
      <div className="mt-2 h-56 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={buckets} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e1" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#a29e97" }} />
            <YAxis tick={{ fontSize: 11, fill: "#a29e97" }} unit="%" domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e7e5e1", borderRadius: 10, fontSize: 12 }} />
            <Line type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={2} dot={{ fill: "#4f46e5", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
