"use client";

import { useMemo } from "react";

import { NotificationFeed } from "@/components/notifications/notification-feed";
import { LoyaltyStampCard } from "@/components/notifications/loyalty-stamp-card";
import { useBookingStore } from "@/lib/store/booking-store";

export default function NotificationsPage() {
  const customerId = useBookingStore((s) => s.currentCustomerId);
  const allNotifications = useBookingStore((s) => s.notifications);
  const notifications = useMemo(
    () => allNotifications.filter((n) => n.customerId === customerId),
    [allNotifications, customerId]
  );

  const stampNotifications = notifications.filter((n) => n.kind === "loyalty-stamp");
  const latestStamp = stampNotifications[stampNotifications.length - 1];
  const match = latestStamp?.message.match(/(\d+)\/(\d+)/);
  const collected = match ? Number(match[1]) : 0;
  const total = match ? Number(match[2]) : 8;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">Notifications</h1>
        <p className="mt-1 text-ink2">Simulated LINE OA messages — confirmations, coupons, and loyalty stamps.</p>
      </div>

      {stampNotifications.length > 0 && <LoyaltyStampCard collected={collected} total={total} />}

      <NotificationFeed notifications={notifications} />
    </div>
  );
}
