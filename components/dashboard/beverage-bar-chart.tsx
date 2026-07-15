"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { topBeveragesByQty } from "@/lib/analytics/dashboard-metrics";
import { BEVERAGES } from "@/lib/data/mock-data";
import type { BeverageOrder } from "@/lib/data/types";

export function BeverageBarChart({ orders }: { orders: BeverageOrder[] }) {
  const data = topBeveragesByQty(orders, BEVERAGES, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Services & Beverages</CardTitle>
        <CardDescription>Units ordered via in-room QR ordering</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-c)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ink-muted)" }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "var(--ink-muted)" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-c)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="qty" fill="var(--accent-2)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
