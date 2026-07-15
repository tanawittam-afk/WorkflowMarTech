"use client";

import { useMemo, useState } from "react";
import { Bell, CupSoda, Minus, Plus, QrCode } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBookingStore } from "@/lib/store/booking-store";
import { BEVERAGES } from "@/lib/data/mock-data";
import type { Booking } from "@/lib/data/types";

/**
 * In-room QR beverage ordering (MarTech brief touchpoint 3): the customer
 * scans the QR inside the room, orders drinks in rounds, and everything
 * accumulates on one post-paid bill settled at checkout ("Teenoi-style").
 */
export function InRoomOrderPanel({ booking }: { booking: Booking }) {
  const orders = useBookingStore((s) => s.orders);
  const addOrder = useBookingStore((s) => s.addOrder);
  const [cart, setCart] = useState<Record<string, number>>({});

  const bookingOrders = useMemo(
    () => orders.filter((o) => o.bookingId === booking.id),
    [orders, booking.id]
  );
  const billTotal = bookingOrders.reduce((s, o) => s + o.amount, 0);

  const durationHours =
    parseInt(booking.endTime.slice(0, 2), 10) - parseInt(booking.startTime.slice(0, 2), 10);
  const showTrigger = durationHours >= 2 && bookingOrders.length === 0;

  const cartLines = Object.entries(cart).filter(([, qty]) => qty > 0);
  const cartTotal = cartLines.reduce((s, [bevId, qty]) => {
    const bev = BEVERAGES.find((b) => b.id === bevId)!;
    return s + bev.price * qty;
  }, 0);

  function bump(bevId: string, delta: number) {
    setCart((prev) => ({ ...prev, [bevId]: Math.max(0, (prev[bevId] ?? 0) + delta) }));
  }

  function sendOrder() {
    if (cartLines.length === 0) return;
    addOrder(
      booking.id,
      cartLines.map(([bevId, qty]) => {
        const bev = BEVERAGES.find((b) => b.id === bevId)!;
        return { bevId, qty, unitPrice: bev.price };
      })
    );
    setCart({});
    toast.success(`Order sent to the counter — ฿${cartTotal} added to your room bill`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="size-4 text-accent-strong" />
          In-room QR ordering
        </CardTitle>
        <CardDescription>
          Order drinks to your room — pay everything in one bill at checkout.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {showTrigger && (
          <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-warning-soft px-3 py-2 text-xs text-warning">
            <Bell className="mt-0.5 size-4 shrink-0" />
            Auto-trigger fired: booked 2+ hours with no orders yet — a 20% coffee coupon was just
            pushed to your LINE OA.
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {BEVERAGES.map((bev) => {
            const qty = cart[bev.id] ?? 0;
            return (
              <div
                key={bev.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-line px-3 py-2"
              >
                <div>
                  <p className="text-sm text-ink">{bev.name}</p>
                  <p className="text-xs text-ink3">฿{bev.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    aria-label={`Remove ${bev.name}`}
                    onClick={() => bump(bev.id, -1)}
                  >
                    <Minus className="size-3" />
                  </Button>
                  <span className="w-4 text-center font-mono text-sm text-ink">{qty}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    aria-label={`Add ${bev.name}`}
                    onClick={() => bump(bev.id, 1)}
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Button disabled={cartLines.length === 0} onClick={sendOrder}>
          <CupSoda className="size-4" />
          Send order{cartTotal > 0 ? ` — ฿${cartTotal}` : ""}
        </Button>

        {bookingOrders.length > 0 && (
          <div className="rounded-[var(--radius-md)] bg-surface2 px-3 py-2 text-sm">
            <p className="mb-1 text-xs font-medium text-ink3">Room bill so far (paid at checkout)</p>
            {bookingOrders.map((o) => (
              <div key={o.id} className="flex justify-between text-xs text-ink2">
                <span>
                  {o.lines
                    .map((l) => `${BEVERAGES.find((b) => b.id === l.bevId)?.name ?? l.bevId} ×${l.qty}`)
                    .join(", ")}
                </span>
                <span className="font-mono">฿{o.amount}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-line pt-1 text-sm text-ink">
              <span>Round 2 total</span>
              <span className="font-mono font-semibold">฿{billTotal}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
