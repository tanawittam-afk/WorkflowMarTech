"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBookingStore } from "@/lib/store/booking-store";
import { formatHour } from "@/lib/booking-helpers";
import type { ZoneId } from "@/lib/data/types";

export function ConfirmForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const zoneId = searchParams.get("zoneId") as ZoneId | null;
  const roomId = searchParams.get("roomId");
  const date = searchParams.get("date");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");
  const amountPaid = Number(searchParams.get("amountPaid") ?? 0);

  const zones = useBookingStore((s) => s.zones);
  const rooms = useBookingStore((s) => s.rooms);
  const currentCustomerId = useBookingStore((s) => s.currentCustomerId);
  const createBooking = useBookingStore((s) => s.createBooking);

  const zone = zones.find((z) => z.id === zoneId);
  const room = rooms.find((r) => r.id === roomId);

  if (!zone || !room || !date || !startTime || !endTime || !currentCustomerId) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-ink2">Missing booking details. Please start over.</p>
          <Button className="mt-4" onClick={() => router.push("/book")}>
            Back to booking
          </Button>
        </CardContent>
      </Card>
    );
  }

  function handlePay() {
    const booking = createBooking({
      customerId: currentCustomerId!,
      zoneId: zone!.id,
      roomId: room!.id,
      date: date!,
      startTime: startTime!,
      endTime: endTime!,
      amountPaid,
    });
    router.push(`/qr/${booking.id}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review & pay</CardTitle>
        <CardDescription>Simulated payment — no real charge occurs.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt className="text-ink3">Zone</dt>
          <dd className="text-ink">{zone.name}</dd>
          <dt className="text-ink3">Room</dt>
          <dd className="text-ink">{room.name}</dd>
          <dt className="text-ink3">Date</dt>
          <dd className="text-ink">{date}</dd>
          <dt className="text-ink3">Time</dt>
          <dd className="text-ink">
            {formatHour(startTime.slice(0, 2))} – {formatHour(endTime.slice(0, 2))}
          </dd>
          <dt className="text-ink3">Total</dt>
          <dd className="font-mono font-semibold text-ink">฿{amountPaid}</dd>
        </dl>
        <Button className="w-full" onClick={handlePay}>
          <CreditCard className="size-4" />
          Pay & confirm booking
        </Button>
      </CardContent>
    </Card>
  );
}
