"use client";

import { use } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCodeDisplay } from "@/components/qr/qr-code-display";
import { SimulateScanButton } from "@/components/qr/simulate-scan-button";
import { useBookingStore } from "@/lib/store/booking-store";
import { formatHour } from "@/lib/booking-helpers";

const STATUS_VARIANT = {
  upcoming: "default",
  "checked-in": "success",
  completed: "secondary",
  cancelled: "danger",
} as const;

export default function QrPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const booking = useBookingStore((s) => s.bookings.find((b) => b.id === bookingId));
  const zone = useBookingStore((s) => s.zones.find((z) => z.id === booking?.zoneId));
  const room = useBookingStore((s) => s.rooms.find((r) => r.id === booking?.roomId));

  if (!booking) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent>
          <p className="text-sm text-ink2">Booking not found.</p>
          <Button className="mt-4" asChild>
            <Link href="/book">Back to booking</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your booking</CardTitle>
            <Badge variant={STATUS_VARIANT[booking.status]}>{booking.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-ink3">Zone</dt>
            <dd className="text-ink">{zone?.name}</dd>
            <dt className="text-ink3">Room</dt>
            <dd className="text-ink">{room?.name}</dd>
            <dt className="text-ink3">Date</dt>
            <dd className="text-ink">{booking.date}</dd>
            <dt className="text-ink3">Time</dt>
            <dd className="text-ink">
              {formatHour(booking.startTime.slice(0, 2))} – {formatHour(booking.endTime.slice(0, 2))}
            </dd>
          </dl>

          <QrCodeDisplay value={booking.qrToken} />
          <p className="text-center text-xs text-ink3">
            Scan this at the door to check in/out — this will simulate the room&apos;s power, lights,
            and AC turning on or off.
          </p>

          <SimulateScanButton booking={booking} />
        </CardContent>
      </Card>
    </div>
  );
}
