// Illustrative for this prototype — simple frequency/percentage aggregation,
// not a statistical model.

import type { Customer } from "@/lib/data/types";

export interface Breakdown {
  label: string;
  count: number;
  percent: number;
}

function toBreakdown(counts: Map<string, number>, total: number): Breakdown[] {
  return Array.from(counts.entries()).map(([label, count]) => ({
    label,
    count,
    percent: total === 0 ? 0 : Math.round((count / total) * 1000) / 10,
  }));
}

export function genderBreakdown(customers: Customer[]): Breakdown[] {
  const counts = new Map<string, number>();
  for (const c of customers) counts.set(c.gender, (counts.get(c.gender) ?? 0) + 1);
  return toBreakdown(counts, customers.length);
}

export function occupationBreakdown(customers: Customer[]): Breakdown[] {
  const counts = new Map<string, number>();
  for (const c of customers) counts.set(c.occupation, (counts.get(c.occupation) ?? 0) + 1);
  return toBreakdown(counts, customers.length);
}

const AGE_BANDS: [string, (age: number) => boolean][] = [
  ["< 20", (a) => a < 20],
  ["20-24", (a) => a >= 20 && a <= 24],
  ["25-29", (a) => a >= 25 && a <= 29],
  ["30-39", (a) => a >= 30 && a <= 39],
  ["40+", (a) => a >= 40],
];

export function ageBandBreakdown(customers: Customer[]): Breakdown[] {
  const counts = new Map<string, number>();
  for (const [label] of AGE_BANDS) counts.set(label, 0);
  for (const c of customers) {
    const band = AGE_BANDS.find(([, test]) => test(c.age));
    if (band) counts.set(band[0], (counts.get(band[0]) ?? 0) + 1);
  }
  return toBreakdown(counts, customers.length).filter((b) => b.count > 0);
}

const INCOME_BANDS: [string, (income: number) => boolean][] = [
  ["< 10k THB", (i) => i < 10000],
  ["10k-25k THB", (i) => i >= 10000 && i < 25000],
  ["25k-50k THB", (i) => i >= 25000 && i < 50000],
  ["50k+ THB", (i) => i >= 50000],
];

export function incomeBandBreakdown(customers: Customer[]): Breakdown[] {
  const counts = new Map<string, number>();
  for (const [label] of INCOME_BANDS) counts.set(label, 0);
  for (const c of customers) {
    const band = INCOME_BANDS.find(([, test]) => test(c.income));
    if (band) counts.set(band[0], (counts.get(band[0]) ?? 0) + 1);
  }
  return toBreakdown(counts, customers.length).filter((b) => b.count > 0);
}

export function topBreakdownLabel(breakdown: Breakdown[]): Breakdown | undefined {
  return [...breakdown].sort((a, b) => b.count - a.count)[0];
}
