// Illustrative for this prototype — a rule-based heuristic score presented
// as a simulated classifier output, not a trained model.

import type { Booking, Customer, Review } from "@/lib/data/types";
import { scoreSentiment } from "./sentiment";

export type ChurnRisk = "Low" | "Medium" | "High";

export interface ChurnEntry {
  customerId: string;
  name: string;
  riskScore: number;
  risk: ChurnRisk;
  daysSinceLastBooking: number | null;
  bookingsLast30d: number;
  bookingsPrior30d: number;
  avgCsat: number | null;
  hasNegativeReview: boolean;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeChurnRisk(
  customer: Customer,
  bookings: Booking[],
  reviews: Review[],
  todayIso: string
): ChurnEntry {
  const today = new Date(`${todayIso}T00:00:00`);
  const customerBookings = bookings.filter((b) => b.customerId === customer.customerId);

  const bookingDates = customerBookings.map((b) => new Date(`${b.date}T00:00:00`));
  const lastBookingDate = bookingDates.length
    ? new Date(Math.max(...bookingDates.map((d) => d.getTime())))
    : null;
  const daysSinceLastBooking = lastBookingDate ? daysBetween(today, lastBookingDate) : null;

  const bookingsLast30d = bookingDates.filter((d) => daysBetween(today, d) <= 30).length;
  const bookingsPrior30d = bookingDates.filter(
    (d) => daysBetween(today, d) > 30 && daysBetween(today, d) <= 60
  ).length;

  const ratedBookings = customerBookings.filter((b) => typeof b.csatRating === "number");
  const avgCsat = ratedBookings.length
    ? ratedBookings.reduce((s, b) => s + (b.csatRating ?? 0), 0) / ratedBookings.length
    : null;

  const customerReviews = reviews.filter((r) => r.customerId === customer.customerId);
  const hasNegativeReview = customerReviews.some((r) => scoreSentiment(r).sentiment === "negative");

  let riskScore = 0;
  if (daysSinceLastBooking === null || daysSinceLastBooking > 30) riskScore += 3;
  if (avgCsat !== null && avgCsat <= 3) riskScore += 2;
  if (hasNegativeReview) riskScore += 2;
  if (bookingsLast30d < bookingsPrior30d) riskScore += 1;

  const risk: ChurnRisk = riskScore >= 4 ? "High" : riskScore >= 2 ? "Medium" : "Low";

  return {
    customerId: customer.customerId,
    name: customer.name,
    riskScore,
    risk,
    daysSinceLastBooking,
    bookingsLast30d,
    bookingsPrior30d,
    avgCsat: avgCsat !== null ? Math.round(avgCsat * 10) / 10 : null,
    hasNegativeReview,
  };
}

export function computeChurnRisks(
  customers: Customer[],
  bookings: Booking[],
  reviews: Review[],
  todayIso: string
): ChurnEntry[] {
  return customers.map((c) => computeChurnRisk(c, bookings, reviews, todayIso));
}

export function churnDistribution(entries: ChurnEntry[]) {
  const total = entries.length || 1;
  const counts: Record<ChurnRisk, number> = { Low: 0, Medium: 0, High: 0 };
  for (const e of entries) counts[e.risk]++;
  return (Object.keys(counts) as ChurnRisk[]).map((risk) => ({
    risk,
    count: counts[risk],
    percent: Math.round((counts[risk] / total) * 1000) / 10,
  }));
}
