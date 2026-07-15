"use client";

import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useBookingStore, TODAY_ISO } from "@/lib/store/booking-store";
import {
  addHours,
  formatHour,
  hasConflict,
  HOUR_OPTIONS,
  isOffPeakHour,
  priceForSlot,
} from "@/lib/booking-helpers";
import type { Zone } from "@/lib/data/types";

const DAY_OFFSETS = [0, 1, 2];

function isoPlusDays(days: number): string {
  const d = new Date(`${TODAY_ISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function RoomSlotPicker({
  zone,
  onContinue,
}: {
  zone: Zone;
  onContinue: (selection: {
    roomId: string;
    date: string;
    startTime: string;
    endTime: string;
    amountPaid: number;
  }) => void;
}) {
  const allRooms = useBookingStore((s) => s.rooms);
  const bookings = useBookingStore((s) => s.bookings);
  const dynamicPricing = useBookingStore((s) => s.dynamicPricing);
  const rooms = useMemo(() => allRooms.filter((r) => r.zoneId === zone.id), [allRooms, zone.id]);

  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [dayOffset, setDayOffset] = useState(0);
  const [startHour, setStartHour] = useState(14);
  const [duration, setDuration] = useState(2);

  const date = isoPlusDays(dayOffset);
  const startTime = `${String(startHour).padStart(2, "0")}:00`;
  const endTime = addHours(startHour, duration);
  const amountPaid = priceForSlot(zone, startHour, duration, dynamicPricing);
  const fullPrice = zone.hourlyRate * duration;
  const offPeakApplied = amountPaid < fullPrice;

  const conflict = useMemo(
    () => (roomId ? hasConflict(bookings, roomId, date, startTime, endTime) : false),
    [bookings, roomId, date, startTime, endTime]
  );

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label>Room</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setRoomId(room.id)}
                className={cn(
                  "rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition-colors",
                  roomId === room.id
                    ? "border-accent-strong bg-accent-soft text-accent-strong"
                    : "border-line text-ink2 hover:bg-surface2"
                )}
              >
                {room.name}
                <span className="block text-xs opacity-70">Capacity {room.capacity}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="day">Date</Label>
            <Select value={String(dayOffset)} onValueChange={(v) => setDayOffset(Number(v))}>
              <SelectTrigger id="day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_OFFSETS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d === 0 ? "Today" : d === 1 ? "Tomorrow" : isoPlusDays(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="start">Start time</Label>
            <Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}>
              <SelectTrigger id="start">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {formatHour(h)}
                    {dynamicPricing && isOffPeakHour(h) ? " · Off-Peak −18%" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="duration">Duration</Label>
            <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} hour{d > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {conflict && (
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-danger-soft px-3 py-2 text-sm text-danger">
            <AlertCircle className="size-4 shrink-0" />
            This room is already booked for part of that time slot. Pick another time or room.
          </div>
        )}

        <div className="flex items-center justify-between border-t border-line pt-4">
          <div className="text-sm text-ink2">
            Total: <span className="font-mono font-semibold text-ink">฿{amountPaid}</span>
            {offPeakApplied && (
              <span className="ml-2 text-xs text-success">
                <s className="text-ink3">฿{fullPrice}</s> Off-Peak −18% applied
              </span>
            )}
          </div>
          <Button
            disabled={!roomId || conflict}
            onClick={() => onContinue({ roomId, date, startTime, endTime, amountPaid })}
          >
            Continue to review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
