import type { Booking, Zone } from "@/lib/data/types";

/** "HH:MM" 24h strings compare correctly as plain strings — no Date parsing needed. */
export function hasConflict(
  bookings: Booking[],
  roomId: string,
  date: string,
  startTime: string,
  endTime: string
): boolean {
  return bookings.some(
    (b) =>
      b.roomId === roomId &&
      b.date === date &&
      b.status !== "cancelled" &&
      !(endTime <= b.startTime || b.endTime <= startTime)
  );
}

export const HOUR_OPTIONS = Array.from({ length: 13 }, (_, i) => i + 9); // 9..21

export function addHours(startHour: number, duration: number): string {
  const end = startHour + duration;
  return `${String(end).padStart(2, "0")}:00`;
}

export function formatHour(hour: string | number): string {
  const h = typeof hour === "string" ? parseInt(hour, 10) : hour;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:00 ${period}`;
}

// ---------------------------------------------------------------------------
// Dynamic pricing (MarTech brief): when the marketer enables it, hours the
// demand forecast marks as off-peak are discounted on the booking page.
// ---------------------------------------------------------------------------

export const OFF_PEAK_DISCOUNT = 0.18; // -18%

/** Hours the simulated time-series forecast marks as off-peak. */
export const OFF_PEAK_HOURS = new Set([9, 10, 11, 21]);

export function isOffPeakHour(hour: number): boolean {
  return OFF_PEAK_HOURS.has(hour);
}

/** Hourly rate for a zone at a given start hour, respecting dynamic pricing. */
export function rateForHour(zone: Zone, hour: number, dynamicPricing: boolean): number {
  return dynamicPricing && isOffPeakHour(hour)
    ? Math.round(zone.hourlyRate * (1 - OFF_PEAK_DISCOUNT))
    : zone.hourlyRate;
}

/** Total room fee for a slot (rate locked to the start hour, as one price per booking). */
export function priceForSlot(zone: Zone, startHour: number, duration: number, dynamicPricing: boolean): number {
  return rateForHour(zone, startHour, dynamicPricing) * duration;
}
