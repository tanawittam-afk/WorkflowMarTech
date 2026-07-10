"use client";

import { Ticket, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBookingStore } from "@/lib/store/booking-store";
import type { LineNotification } from "@/lib/data/types";

export function CouponBanner({ notification }: { notification: LineNotification }) {
  const clickCoupon = useBookingStore((s) => s.clickCoupon);

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-warning-soft text-warning">
          <Ticket className="size-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-ink">{notification.message}</p>
          <p className="mt-0.5 text-xs text-ink3">
            {new Date(notification.createdAt).toLocaleDateString()}
          </p>
        </div>
        {notification.clickedCoupon ? (
          <span className="flex items-center gap-1 text-xs font-medium text-success">
            <Check className="size-3.5" /> Used
          </span>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => clickCoupon(notification.id)}>
            Use this coupon
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
