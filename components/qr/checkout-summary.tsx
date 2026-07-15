"use client";

import { useMemo, useState } from "react";
import { Receipt, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useBookingStore } from "@/lib/store/booking-store";
import { BEVERAGES } from "@/lib/data/mock-data";
import type { Booking } from "@/lib/data/types";

/**
 * Post-checkout bill: round 1 (pre-paid room fee) + round 2 (accumulated
 * in-room QR orders) unified under one customer — plus the CSAT capture
 * that feeds the marketing dashboard.
 */
export function CheckoutSummary({ booking }: { booking: Booking }) {
  const orders = useBookingStore((s) => s.orders);
  const submitCsat = useBookingStore((s) => s.submitCsat);
  const [pendingRating, setPendingRating] = useState<1 | 2 | 3 | 4 | 5>(5);

  const bookingOrders = useMemo(
    () => orders.filter((o) => o.bookingId === booking.id),
    [orders, booking.id]
  );
  const bevTotal = bookingOrders.reduce((s, o) => s + o.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="size-4 text-accent-strong" />
          Checkout bill
        </CardTitle>
        <CardDescription>Both payment rounds unified under your LINE UID.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-[var(--radius-md)] bg-surface2 px-3 py-2 text-sm">
          <div className="flex justify-between text-ink2">
            <span>Round 1 · Room fee (pre-paid online)</span>
            <span className="font-mono">฿{booking.amountPaid}</span>
          </div>
          <div className="mt-1 flex justify-between text-ink2">
            <span>Round 2 · In-room drinks ({bookingOrders.length} order{bookingOrders.length === 1 ? "" : "s"})</span>
            <span className="font-mono">฿{bevTotal}</span>
          </div>
          {bookingOrders.length > 0 && (
            <p className="mt-1 text-xs text-ink3">
              {bookingOrders
                .flatMap((o) => o.lines)
                .map((l) => `${BEVERAGES.find((b) => b.id === l.bevId)?.name ?? l.bevId} ×${l.qty}`)
                .join(" · ")}
            </p>
          )}
          <div className="mt-2 flex justify-between border-t border-line pt-2 text-ink">
            <span className="font-medium">Total this visit</span>
            <span className="font-mono font-semibold">฿{booking.amountPaid + bevTotal}</span>
          </div>
        </div>

        {booking.csatRating ? (
          <div className="flex items-center justify-center gap-1 text-sm text-ink2">
            Thanks for rating us
            <span className="ml-1 inline-flex">
              {Array.from({ length: booking.csatRating }, (_, i) => (
                <Star key={i} className="size-4 fill-warning text-warning" />
              ))}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-ink2">How was your session? (CSAT)</p>
            <div className="flex gap-1">
              {([1, 2, 3, 4, 5] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-label={`Rate ${r} star${r > 1 ? "s" : ""}`}
                  onClick={() => setPendingRating(r)}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      "size-6 transition-colors",
                      r <= pendingRating ? "fill-warning text-warning" : "text-ink3/40"
                    )}
                  />
                </button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => {
                submitCsat(booking.id, pendingRating);
                toast.success("Thanks! Your rating was saved.");
              }}
            >
              Submit rating
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
