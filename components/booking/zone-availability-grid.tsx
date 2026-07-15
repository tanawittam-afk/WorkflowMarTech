"use client";

import { BookOpen, Mic2, MonitorPlay } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBookingStore, TODAY_ISO } from "@/lib/store/booking-store";
import type { Zone, ZoneId } from "@/lib/data/types";

const ZONE_ICONS: Record<ZoneId, typeof Mic2> = {
  "zone-small": BookOpen,
  "zone-medium": MonitorPlay,
  "zone-large": Mic2,
};

const ZONE_BADGE_VARIANT: Record<ZoneId, "zone-small" | "zone-medium" | "zone-large"> = {
  "zone-small": "zone-small",
  "zone-medium": "zone-medium",
  "zone-large": "zone-large",
};

export function ZoneAvailabilityGrid({
  selectedZoneId,
  onSelect,
}: {
  selectedZoneId: ZoneId | null;
  onSelect: (zone: Zone) => void;
}) {
  const zones = useBookingStore((s) => s.zones);
  const bookings = useBookingStore((s) => s.bookings);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {zones.map((zone) => {
        const Icon = ZONE_ICONS[zone.id];
        const bookedToday = bookings.filter(
          (b) => b.zoneId === zone.id && b.date === TODAY_ISO && b.status !== "cancelled"
        ).length;
        const selected = selectedZoneId === zone.id;
        return (
          <Card
            key={zone.id}
            className={cn(
              "card-hover cursor-pointer transition-colors",
              selected && "border-accent-strong ring-2 ring-accent-soft"
            )}
            onClick={() => onSelect(zone)}
          >
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent-strong">
                  <Icon className="size-5" />
                </div>
                <Badge variant={ZONE_BADGE_VARIANT[zone.id]}>{zone.shortName}</Badge>
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold text-ink">{zone.name}</h3>
                <p className="mt-1 text-sm text-ink2">{zone.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {zone.amenities.slice(0, 3).map((a) => (
                  <span key={a} className="rounded-[var(--radius-full)] bg-surface2 px-2 py-0.5 text-xs text-ink3">
                    {a}
                  </span>
                ))}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-ink3">
                <span>฿{zone.hourlyRate}/hr</span>
                <span>{bookedToday} booking{bookedToday === 1 ? "" : "s"} today</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
