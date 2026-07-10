"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DoorOpen, DoorClosed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBookingStore } from "@/lib/store/booking-store";
import type { Booking } from "@/lib/data/types";

export function SimulateScanButton({ booking }: { booking: Booking }) {
  const checkIn = useBookingStore((s) => s.checkIn);
  const checkOut = useBookingStore((s) => s.checkOut);
  const [busy, setBusy] = useState(false);

  if (booking.status === "completed" || booking.status === "cancelled") {
    return null;
  }

  const isUpcoming = booking.status === "upcoming";

  function handleScan() {
    setBusy(true);
    setTimeout(() => {
      if (isUpcoming) {
        checkIn(booking.id);
        toast.success("Checked in! Room power, lights, and AC are now on.");
      } else {
        checkOut(booking.id);
        toast.success("Checked out. Room power, lights, and AC are now off.");
      }
      setBusy(false);
    }, 500);
  }

  return (
    <Button className="w-full" onClick={handleScan} disabled={busy}>
      {isUpcoming ? <DoorOpen className="size-4" /> : <DoorClosed className="size-4" />}
      {busy ? "Scanning…" : isUpcoming ? "Simulate door scan (check in)" : "Simulate door scan (check out)"}
    </Button>
  );
}
