"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ageBandBreakdown,
  genderBreakdown,
  incomeBandBreakdown,
  occupationBreakdown,
  topBreakdownLabel,
  type Breakdown,
} from "@/lib/analytics/profile";
import type { Customer } from "@/lib/data/types";

function BreakdownBars({ data }: { data: Breakdown[] }) {
  return (
    <div className="flex flex-col gap-2">
      {data.map((b) => (
        <div key={b.label} className="flex items-center gap-3 text-sm">
          <span className="w-24 shrink-0 text-ink2">{b.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-[var(--radius-full)] bg-surface2">
            <div className="h-full bg-accent" style={{ width: `${b.percent}%` }} />
          </div>
          <span className="w-16 shrink-0 text-right font-mono text-xs text-ink3">
            {b.count} ({b.percent}%)
          </span>
        </div>
      ))}
    </div>
  );
}

export function CustomerProfilePanel({ customers }: { customers: Customer[] }) {
  const gender = genderBreakdown(customers);
  const occupation = occupationBreakdown(customers);
  const ageBands = ageBandBreakdown(customers);
  const incomeBands = incomeBandBreakdown(customers);

  const topAge = topBreakdownLabel(ageBands);
  const topOccupation = topBreakdownLabel(occupation);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <p className="text-sm text-ink">
            Most customers are aged <strong>{topAge?.label}</strong> ({topAge?.percent}%), and the
            majority are <strong>{topOccupation?.label}</strong> ({topOccupation?.percent}%).
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gender</CardTitle>
            <CardDescription>Frequency / percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars data={gender} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Occupation</CardTitle>
            <CardDescription>Students vs. Freelancers</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars data={occupation} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Age bands</CardTitle>
            <CardDescription>Frequency / percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars data={ageBands} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Income bands</CardTitle>
            <CardDescription>Monthly THB, frequency / percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars data={incomeBands} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
