/**
 * Metrics engine — recomputed from the reducer state on every dispatch, plus
 * the fixed pre-CDP baselines the goal bars measure progress against.
 */

import {
  baseHeatFor,
  BEV_BY_ID,
  CUSTOMERS,
  OFF_PEAK_HOURS,
  ROOM_BY_ID,
  ROOMS,
  type AppState,
  type Persona,
} from "./domain";
import { HISTORY } from "./history";

/* ============================================================
   Metrics engine (recomputed from state on every dispatch)
   ============================================================ */

export interface ChurnRow {
  uid: string;
  name: string;
  occupation: string;
  persona: Persona;
  monetary: number;
  recency: number;
  risk: number;
  couponSent: boolean;
}

export function computeMetrics(state: AppState) {
  const { bookings, billings } = state;
  const billingByBooking = new Map(billings.map((b) => [b.bookingId, b]));

  const b30 = bookings.filter((b) => b.dayOffset <= 30);
  const roomRev30 = b30.reduce((s, b) => s + b.amount, 0);
  const bevRev30 = b30.reduce((s, b) => s + (billingByBooking.get(b.id)?.amount ?? 0), 0);
  const attach30 = b30.length === 0 ? 0 : (b30.filter((b) => billingByBooking.has(b.id)).length / b30.length) * 100;
  const aov30 = b30.length === 0 ? 0 : (roomRev30 + bevRev30) / b30.length;
  const bookingCount30 = b30.length;
  const avgRoomRevPerBooking30 = b30.length === 0 ? 0 : roomRev30 / b30.length;
  const offPeakShare30 = b30.length === 0 ? 0 : (b30.filter((b) => OFF_PEAK_HOURS.has(b.hour)).length / b30.length) * 100;

  // Per-customer rollup (single customer view via LINE UID).
  const perCustomer = new Map<string, { recency: number; monetary: number; count30: number }>();
  for (const c of CUSTOMERS) perCustomer.set(c.uid, { recency: 999, monetary: 0, count30: 0 });
  for (const b of bookings) {
    const row = perCustomer.get(b.customerId);
    if (!row) continue;
    row.recency = Math.min(row.recency, b.dayOffset);
    row.monetary += b.amount + (billingByBooking.get(b.id)?.amount ?? 0);
    if (b.dayOffset <= 30) row.count30 += 1;
  }

  const active = [...perCustomer.values()].filter((r) => r.count30 > 0);
  const repeatRate = active.length === 0 ? 0 : (active.filter((r) => r.count30 >= 2).length / active.length) * 100;

  const churnRows: ChurnRow[] = CUSTOMERS.map((c) => {
    const row = perCustomer.get(c.uid)!;
    const risk = Math.min(97, Math.max(4, Math.round(row.recency * 3 + (c.persona !== "student" ? 6 : 0))));
    return {
      uid: c.uid,
      name: c.name,
      occupation: c.occupation,
      persona: c.persona,
      monetary: row.monetary,
      recency: row.recency,
      risk,
      couponSent: state.couponOffers.includes(c.uid),
    };
  })
    .filter((r) => r.risk >= 80)
    .sort((a, b) => b.risk - a.risk);

  // Occupancy: mean forecast heat across business hours + today's real bookings.
  let heatSum = 0;
  let heatCells = 0;
  for (const room of ROOMS) {
    for (let h = 9; h <= 21; h++) {
      heatSum += baseHeatFor(room, h);
      heatCells++;
    }
  }
  const newCells = bookings.filter((b) => b.isNew).reduce((s, b) => s + b.duration, 0);
  const occupancy = Math.min(100, (heatSum / heatCells) * 100 + (newCells / heatCells) * 100);

  // Top services (share of 30-day bookings per room type).
  const typeCount = new Map<string, number>();
  for (const b of b30) {
    const t = ROOM_BY_ID.get(b.roomId)!.type;
    typeCount.set(t, (typeCount.get(t) ?? 0) + 1);
  }
  const pieData = [...typeCount.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Top beverages by 30-day quantity.
  const bevQty = new Map<string, number>();
  for (const b of b30) {
    const bill = billingByBooking.get(b.id);
    if (!bill) continue;
    for (const line of bill.lines) bevQty.set(line.bevId, (bevQty.get(line.bevId) ?? 0) + line.qty);
  }
  const barData = [...bevQty.entries()]
    .map(([bevId, qty]) => ({ name: BEV_BY_ID.get(bevId)!.name, qty, bevId }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  const lineConversion = state.couponsSent === 0 ? 0 : (state.couponsConverted / state.couponsSent) * 100;
  const csat = state.csatCount === 0 ? 0 : state.csatSum / state.csatCount;

  return {
    roomRev30,
    bevRev30,
    attach30,
    aov30,
    bookingCount30,
    avgRoomRevPerBooking30,
    offPeakShare30,
    totalCustomers: CUSTOMERS.length,
    activeCount: active.length,
    repeatRate,
    occupancy,
    pieData,
    barData,
    churnRows,
    lineConversion,
    csat,
    topService: pieData[0]?.name ?? "—",
    topServiceShare: pieData.length === 0 ? 0 : (pieData[0].value / b30.length) * 100,
  };
}

export type Metrics = ReturnType<typeof computeMetrics>;

/** Pre-CDP baselines — fixed at first render so goal bars tell a story. */
export const INITIAL_STATE_FOR_BASELINE: AppState = {
  bookings: HISTORY.bookings,
  billings: HISTORY.billings,
  dynamicPricing: false,
  activeBundles: [],
  couponOffers: [],
  couponsSent: 47,
  couponsConverted: 16,
  csatSum: 578,
  csatCount: 126,
  events: [],
  nextEventId: 1,
  proposals: [],
  nextProposalId: 1,
};

export const M0 = computeMetrics(INITIAL_STATE_FOR_BASELINE);
export const BASELINES = {
  revenue: Math.round(M0.roomRev30 / 1.062), // history already shows +6.2% since CDP launch
  attach: 22, // pre-CDP beverage attach rate (%)
  aov: Math.round(M0.aov30 / 1.052),
};

export function goalProgress(current: number, baseline: number, target: number): number {
  if (target === baseline) return 0;
  return Math.min(100, Math.max(0, ((current - baseline) / (target - baseline)) * 100));
}
