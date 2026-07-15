// Illustrative for this prototype — real-data rollups feeding the CDP
// dashboard's goal bars and KPI row (distinct from the simulated
// classifiers in churn.ts / sentiment.ts / topics.ts).

import type { Beverage, BeverageOrder, Booking, LineNotification, Room } from "@/lib/data/types";

const OPERATING_HOURS_PER_DAY = 15; // matches the 8am-10pm window shown elsewhere on the dashboard
const WINDOW_DAYS = 30;

function isoDaysAgo(todayIso: string, daysAgo: number): string {
  const d = new Date(`${todayIso}T00:00:00`);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export interface DashboardMetrics {
  revenue30: number;
  attachRate30: number;
  combinedAov30: number;
  occupancyRate: number;
  topBeverage: { name: string; qty: number } | null;
  lineOaConversionRate: number;
}

export function computeDashboardMetrics(
  bookings: Booking[],
  orders: BeverageOrder[],
  notifications: LineNotification[],
  rooms: Room[],
  beverages: Beverage[],
  todayIso: string
): DashboardMetrics {
  const cutoff = isoDaysAgo(todayIso, WINDOW_DAYS);
  const active30 = bookings.filter((b) => b.status !== "cancelled" && b.date >= cutoff && b.date <= todayIso);

  const revenue30 = active30.reduce((s, b) => s + b.amountPaid, 0);

  const orderAmountByBooking = new Map<string, number>();
  for (const o of orders) {
    orderAmountByBooking.set(o.bookingId, (orderAmountByBooking.get(o.bookingId) ?? 0) + o.amount);
  }
  const bevRevenue30 = active30.reduce((s, b) => s + (orderAmountByBooking.get(b.id) ?? 0), 0);
  const attachRate30 = active30.length
    ? (active30.filter((b) => orderAmountByBooking.has(b.id)).length / active30.length) * 100
    : 0;
  const combinedAov30 = active30.length ? (revenue30 + bevRevenue30) / active30.length : 0;

  const bookedHours30 = active30.reduce((s, b) => {
    const start = parseInt(b.startTime.slice(0, 2), 10);
    const end = parseInt(b.endTime.slice(0, 2), 10);
    return s + Math.max(0, end - start);
  }, 0);
  const capacityHours = rooms.length * OPERATING_HOURS_PER_DAY * WINDOW_DAYS;
  const occupancyRate = capacityHours ? Math.min(100, (bookedHours30 / capacityHours) * 100) : 0;

  const topBeverage = topBeveragesByQty(orders, beverages, 1)[0] ?? null;
  const topBeverageResult = topBeverage && topBeverage.qty > 0 ? topBeverage : null;

  const coupons = notifications.filter((n) => n.kind === "broadcast-coupon");
  const clicked = coupons.filter((n) => n.clickedCoupon);
  const converted = clicked.filter((n) => n.ledToCheckIn);
  const lineOaConversionRate = clicked.length ? (converted.length / clicked.length) * 100 : 0;

  return {
    revenue30,
    attachRate30,
    combinedAov30,
    occupancyRate,
    topBeverage: topBeverageResult,
    lineOaConversionRate,
  };
}

export function topBeveragesByQty(orders: BeverageOrder[], beverages: Beverage[], limit = 6) {
  const qtyByBev = new Map<string, number>();
  for (const o of orders) {
    for (const line of o.lines) qtyByBev.set(line.bevId, (qtyByBev.get(line.bevId) ?? 0) + line.qty);
  }
  return beverages
    .map((b) => ({ name: b.name, qty: qtyByBev.get(b.id) ?? 0 }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}
