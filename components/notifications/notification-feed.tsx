import { BellRing, CalendarCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { CouponBanner } from "./coupon-banner";
import type { LineNotification } from "@/lib/data/types";

export function NotificationFeed({ notifications }: { notifications: LineNotification[] }) {
  const sorted = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (sorted.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <BellRing className="size-6 text-ink3" />
          <p className="text-sm text-ink3">No notifications yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((n) => {
        if (n.kind === "broadcast-coupon") {
          return <CouponBanner key={n.id} notification={n} />;
        }
        if (n.kind === "loyalty-stamp") {
          return null; // surfaced via <LoyaltyStampCard> summary instead
        }
        return (
          <Card key={n.id}>
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent-strong">
                <CalendarCheck className="size-5" />
              </div>
              <div>
                <p className="text-sm text-ink">{n.message}</p>
                <p className="mt-0.5 text-xs text-ink3">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
