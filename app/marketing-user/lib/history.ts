/**
 * Seeded mock history (fact_bookings + fact_billings).
 *
 * Generated with a deterministic PRNG at module scope so the server prerender
 * and the client hydration always agree — do not introduce Math.random() or
 * absolute clock reads here.
 */

import {
  BEV_BY_ID,
  BEVERAGES,
  CUSTOMERS,
  ROOM_BY_ID,
  type Billing,
  type Booking,
  type OrderLine,
} from "./domain";

export function mulberry32(seed: number) {
  let t0 = seed;
  return function () {
    let t = (t0 += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Length of the generated history window, in days. */
export const HISTORY_DAYS = 90;

export function generateHistory(): { bookings: Booking[]; billings: Billing[] } {
  const rng = mulberry32(20260715);
  const bookings: Booking[] = [];
  const billings: Billing[] = [];
  let seq = 1;

  for (const c of CUSTOMERS) {
    const span = 88 - c.recencyDays;
    for (let k = 0; k < c.freq90; k++) {
      const dayOffset = c.recencyDays + Math.round((k * span) / c.freq90 + rng() * 4);
      const hour = Math.min(21, Math.max(8, c.baseHour + Math.floor(rng() * 3) - 1));
      const duration = c.persona === "pro" ? 2 + Math.floor(rng() * 3) : 2 + Math.floor(rng() * 2);

      let roomId: number;
      if (c.persona === "student") {
        roomId = 1 + Math.floor(rng() * 10);
      } else if (c.persona === "creator") {
        roomId = rng() < 0.75 ? 17 + Math.floor(rng() * 2) : 11 + Math.floor(rng() * 6);
      } else {
        roomId = rng() < 0.85 ? 11 + Math.floor(rng() * 6) : 19 + Math.floor(rng() * 2);
      }
      const room = ROOM_BY_ID.get(roomId)!;
      const id = `B${String(seq++).padStart(3, "0")}`;
      bookings.push({ id, customerId: c.uid, roomId, dayOffset, hour, duration, amount: room.rate * duration });

      if (rng() < c.attachProb) {
        const pool = BEVERAGES.filter((b) => b.personas.includes(c.persona));
        const lineCount = 1 + Math.floor(rng() * 2);
        const lines: OrderLine[] = [];
        for (let l = 0; l < lineCount; l++) {
          const bev = pool[Math.floor(rng() * pool.length)];
          const qty = bev.id === "coffeeset" ? 1 : 1 + Math.floor(rng() * 2);
          const existing = lines.find((x) => x.bevId === bev.id);
          if (existing) existing.qty += qty;
          else lines.push({ bevId: bev.id, qty });
        }
        const amount = lines.reduce((s, l) => s + BEV_BY_ID.get(l.bevId)!.price * l.qty, 0);
        billings.push({ bookingId: id, lines, amount });
      }
    }
  }
  return { bookings, billings };
}

export const HISTORY = generateHistory();
