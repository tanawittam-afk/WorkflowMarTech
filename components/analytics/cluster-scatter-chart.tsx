"use client";

import {
  CartesianGrid,
  Legend,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ZAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClusterSummary, ClusterPoint } from "@/lib/analytics/kmeans";

const CLUSTER_COLORS = ["var(--accent)", "var(--accent-2)", "var(--zone-large)"];

export function ClusterScatterChart({
  points,
  summaries,
}: {
  points: ClusterPoint[];
  summaries: ClusterSummary[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Customer segments (K-Means, k=3)</CardTitle>
        <CardDescription>Clustered on age × income — illustrative, not a trained model</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-c)" />
              <XAxis
                type="number"
                dataKey="age"
                name="Age"
                tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
                label={{ value: "Age", position: "insideBottom", offset: -2, fontSize: 11, fill: "var(--ink-muted)" }}
              />
              <YAxis
                type="number"
                dataKey="income"
                name="Income"
                tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
                label={{ value: "Income (THB)", angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--ink-muted)" }}
              />
              <ZAxis range={[80, 80]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-c)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelFormatter={() => ""}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-secondary)" }} />
              {summaries.map((summary) => (
                <Scatter
                  key={summary.cluster}
                  name={summary.label}
                  data={points.filter((p) => p.cluster === summary.cluster)}
                  fill={CLUSTER_COLORS[summary.cluster % CLUSTER_COLORS.length]}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
