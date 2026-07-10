// Illustrative for this prototype — a small hand-written K-Means, not a
// production ML library or trained model. Clusters customers on
// (age, income), min-max normalized so income's larger range doesn't
// dominate Euclidean distance.

import type { Customer } from "@/lib/data/types";

export interface ClusterPoint {
  customerId: string;
  name: string;
  age: number;
  income: number;
  occupation: Customer["occupation"];
  cluster: number;
}

export interface ClusterSummary {
  cluster: number;
  size: number;
  avgAge: number;
  avgIncome: number;
  majorityOccupation: Customer["occupation"];
  label: string;
  centroidAge: number;
  centroidIncome: number;
}

export interface KMeansResult {
  points: ClusterPoint[];
  summaries: ClusterSummary[];
}

function normalize(values: number[]): [number[], number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return [values.map((v) => (v - min) / range), min, range];
}

function distance(a: [number, number], b: [number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function interpretCluster(avgAge: number, avgIncome: number, majorityOccupation: string): string {
  if (majorityOccupation === "Students" && avgIncome < 10000) return "Budget Students";
  if (majorityOccupation === "Freelancers" && avgIncome >= 50000) return "High-Income Freelancers";
  if (majorityOccupation === "Freelancers") return "Growing Freelancers";
  if (avgAge < 21) return "Young Students";
  return "Balanced Regulars";
}

export function runKMeans(customers: Customer[], k = 3, maxIterations = 50): KMeansResult {
  const ages = customers.map((c) => c.age);
  const incomes = customers.map((c) => c.income);
  const [normAges, ageMin, ageRange] = normalize(ages);
  const [normIncomes, incomeMin, incomeRange] = normalize(incomes);
  const points: [number, number][] = normAges.map((a, i) => [a, normIncomes[i]]);

  // k-means++-lite init: first centroid random-ish (fixed index for
  // determinism), rest chosen weighted by squared distance from nearest
  // existing centroid.
  const centroids: [number, number][] = [points[0]];
  while (centroids.length < k) {
    const distances = points.map((p) =>
      Math.min(...centroids.map((c) => distance(p, c) ** 2))
    );
    const totalDist = distances.reduce((a, b) => a + b, 0) || 1;
    const target = totalDist / 2; // deterministic midpoint pick, not Math.random
    let chosen = points[points.length - 1];
    let acc = 0;
    for (let i = 0; i < points.length; i++) {
      acc += distances[i];
      if (acc >= target) {
        chosen = points[i];
        break;
      }
    }
    centroids.push(chosen);
  }

  let assignments = new Array(points.length).fill(0);
  for (let iter = 0; iter < maxIterations; iter++) {
    const newAssignments = points.map((p) => {
      let best = 0;
      let bestDist = Infinity;
      centroids.forEach((c, ci) => {
        const d = distance(p, c);
        if (d < bestDist) {
          bestDist = d;
          best = ci;
        }
      });
      return best;
    });

    let changed = false;
    for (let i = 0; i < newAssignments.length; i++) {
      if (newAssignments[i] !== assignments[i]) changed = true;
    }
    assignments = newAssignments;

    for (let ci = 0; ci < k; ci++) {
      const members = points.filter((_, i) => assignments[i] === ci);
      if (members.length === 0) continue;
      const avgX = members.reduce((s, p) => s + p[0], 0) / members.length;
      const avgY = members.reduce((s, p) => s + p[1], 0) / members.length;
      centroids[ci] = [avgX, avgY];
    }

    if (!changed) break;
  }

  const clusterPoints: ClusterPoint[] = customers.map((c, i) => ({
    customerId: c.customerId,
    name: c.name,
    age: c.age,
    income: c.income,
    occupation: c.occupation,
    cluster: assignments[i],
  }));

  const summaries: ClusterSummary[] = [];
  for (let ci = 0; ci < k; ci++) {
    const members = clusterPoints.filter((p) => p.cluster === ci);
    if (members.length === 0) continue;
    const avgAge = members.reduce((s, p) => s + p.age, 0) / members.length;
    const avgIncome = members.reduce((s, p) => s + p.income, 0) / members.length;
    const occCounts = new Map<string, number>();
    for (const m of members) occCounts.set(m.occupation, (occCounts.get(m.occupation) ?? 0) + 1);
    const majorityOccupation = [...occCounts.entries()].sort((a, b) => b[1] - a[1])[0][0] as Customer["occupation"];
    summaries.push({
      cluster: ci,
      size: members.length,
      avgAge: Math.round(avgAge * 10) / 10,
      avgIncome: Math.round(avgIncome),
      majorityOccupation,
      label: interpretCluster(avgAge, avgIncome, majorityOccupation),
      centroidAge: Math.round(centroids[ci][0] * ageRange + ageMin),
      centroidIncome: Math.round(centroids[ci][1] * incomeRange + incomeMin),
    });
  }

  return { points: clusterPoints, summaries };
}
