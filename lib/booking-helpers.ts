import type { Booking } from "@/lib/data/types";

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
