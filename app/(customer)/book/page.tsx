"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ZoneAvailabilityGrid } from "@/components/booking/zone-availability-grid";
import { RoomSlotPicker } from "@/components/booking/room-slot-picker";
import type { Zone } from "@/lib/data/types";

export default function BookPage() {
  const router = useRouter();
  const [zone, setZone] = useState<Zone | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">Book a space</h1>
        <p className="mt-1 text-ink2">Choose a zone, then pick a room and time slot.</p>
      </div>

      <ZoneAvailabilityGrid selectedZoneId={zone?.id ?? null} onSelect={setZone} />

      {zone && (
        <RoomSlotPicker
          key={zone.id}
          zone={zone}
          onContinue={(selection) => {
            const params = new URLSearchParams({
              zoneId: zone.id,
              roomId: selection.roomId,
              date: selection.date,
              startTime: selection.startTime,
              endTime: selection.endTime,
              amountPaid: String(selection.amountPaid),
            });
            router.push(`/book/confirm?${params.toString()}`);
          }}
        />
      )}
    </div>
  );
}
