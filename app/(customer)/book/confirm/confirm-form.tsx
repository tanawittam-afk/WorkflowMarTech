"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BadgePercent, CreditCard, CupSoda, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBookingStore } from "@/lib/store/booking-store";
import { formatHour } from "@/lib/booking-helpers";
import { BEVERAGES, BUNDLE_DISCOUNT, BUNDLE_RULES, WINBACK_DISCOUNT } from "@/lib/data/mock-data";
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
  const notifications = useBookingStore((s) => s.notifications);
  const activeBundles = useBookingStore((s) => s.activeBundles);
  const createBooking = useBookingStore((s) => s.createBooking);
  const addOrder = useBookingStore((s) => s.addOrder);
  const clickCoupon = useBookingStore((s) => s.clickCoupon);

  const [bundleOpen, setBundleOpen] = useState(false);

  const zone = zones.find((z) => z.id === zoneId);
  const room = rooms.find((r) => r.id === roomId);
  const startHour = startTime ? parseInt(startTime.slice(0, 2), 10) : null;

  // Unused win-back coupon fired from the CDP dashboard → auto-applies -15%.
  const winBackCoupon = useMemo(
    () =>
      notifications.find(
        (n) =>
          n.customerId === currentCustomerId &&
          n.kind === "broadcast-coupon" &&
          n.id.includes("-WB-") &&
          !n.clickedCoupon
      ),
    [notifications, currentCustomerId]
  );
  const payable = winBackCoupon ? Math.round(amountPaid * (1 - WINBACK_DISCOUNT)) : amountPaid;

  // Active Smart Bundling rule matching this zone + start hour → offer pop-up.
  const bundleRule = useMemo(() => {
    if (startHour === null) return undefined;
    return BUNDLE_RULES.find(
      (r) =>
        activeBundles.includes(r.id) &&
        r.zoneId === zoneId &&
        startHour >= r.hourFrom &&
        startHour <= r.hourTo
    );
  }, [activeBundles, zoneId, startHour]);
  const bundleBev = bundleRule ? BEVERAGES.find((b) => b.id === bundleRule.bevId) : undefined;
  const bundlePrice = bundleBev ? Math.round(bundleBev.price * (1 - BUNDLE_DISCOUNT)) : 0;

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

  function commitBooking(withBundle: boolean) {
    const booking = createBooking({
      customerId: currentCustomerId!,
      zoneId: zone!.id,
      roomId: room!.id,
      date: date!,
      startTime: startTime!,
      endTime: endTime!,
      amountPaid: payable,
    });
    if (winBackCoupon) {
      clickCoupon(winBackCoupon.id); // coupon redeemed → counts toward OA conversion on check-in
      toast.success(`Win-back coupon applied — you saved ฿${amountPaid - payable}!`);
    }
    if (withBundle && bundleBev) {
      addOrder(booking.id, [{ bevId: bundleBev.id, qty: 1, unitPrice: bundlePrice }]);
      toast.success(`${bundleBev.name} added to your in-room bill at −15%`);
    }
    router.push(`/qr/${booking.id}`);
  }

  function handlePay() {
    if (bundleRule) setBundleOpen(true);
    else commitBooking(false);
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
          <dd className="font-mono font-semibold text-ink">
            ฿{payable}
            {winBackCoupon && <s className="ml-2 text-xs font-normal text-ink3">฿{amountPaid}</s>}
          </dd>
        </dl>

        {winBackCoupon && (
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-success-soft px-3 py-2 text-sm text-success">
            <BadgePercent className="size-4 shrink-0" />
            LINE OA win-back coupon applied automatically — {Math.round(WINBACK_DISCOUNT * 100)}% off
            this booking.
          </div>
        )}

        <Button className="w-full" onClick={handlePay}>
          <CreditCard className="size-4" />
          Pay & confirm booking
        </Button>
      </CardContent>

      {/* Smart Bundling pop-up (Apriori rule activated by marketing) */}
      <Dialog open={bundleOpen} onOpenChange={setBundleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent-strong" />
              Deal for your session
            </DialogTitle>
            <DialogDescription>
              Customers booking {zone.shortName} rooms at this hour usually add{" "}
              <span className="text-ink">{bundleBev?.name}</span>. Bundle it now for{" "}
              <span className="font-mono text-ink">฿{bundlePrice}</span>{" "}
              <s className="text-ink3">฿{bundleBev?.price}</s> — paid at checkout with your in-room
              bill.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                setBundleOpen(false);
                commitBooking(true);
              }}
            >
              <CupSoda className="size-4" />
              Add bundle & pay
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setBundleOpen(false);
                commitBooking(false);
              }}
            >
              Just the room
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
