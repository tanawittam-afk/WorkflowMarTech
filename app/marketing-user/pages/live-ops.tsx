"use client";

import { Radio } from "lucide-react";

import { ConversionLineChart } from "@/components/dashboard/conversion-line-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { OccupancyHeatmap } from "@/components/dashboard/occupancy-heatmap";
import { SentimentTopicSummary } from "@/components/dashboard/sentiment-topic-summary";
import { ZonePieChart } from "@/components/dashboard/zone-pie-chart";
import { computeDashboardMetrics } from "@/lib/analytics/dashboard-metrics";
import { BEVERAGES } from "@/lib/data/mock-data";
import { TODAY_ISO, useBookingStore } from "@/lib/store/booking-store";

import { Card, SectionHeader } from "../components/primitives";

// Illustrative baseline for the MoM registration-growth card — this
// prototype has no historical monthly cohorts to compute a real trend from.
const LAST_MONTH_CUSTOMER_BASELINE = 16;

/**
 * Real live-app data (the actual zustand booking store — real customers who
 * registered/booked through the demo flow), separate from every other page
 * in this shell which reads the seeded CDP mock engine. Deliberately reuses
 * `components/dashboard/*` widgets as-is (dark-glass tokens) rather than
 * reskinning them to match the CDP's light blue/white cards — the visual
 * seam is the signal that this section is live, not simulated.
 */
export function LiveOps() {
  const customers = useBookingStore((s) => s.customers);
  const bookings = useBookingStore((s) => s.bookings);
  const zones = useBookingStore((s) => s.zones);
  const rooms = useBookingStore((s) => s.rooms);
  const reviews = useBookingStore((s) => s.reviews);
  const notifications = useBookingStore((s) => s.notifications);
  const orders = useBookingStore((s) => s.orders);

  const totalCustomers = customers.length;
  const registrationRate =
    ((totalCustomers - LAST_MONTH_CUSTOMER_BASELINE) / LAST_MONTH_CUSTOMER_BASELINE) * 100;

  const bookingCountByCustomer = new Map<string, number>();
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    bookingCountByCustomer.set(b.customerId, (bookingCountByCustomer.get(b.customerId) ?? 0) + 1);
  }
  const activeCustomers = bookingCountByCustomer.size;
  const repeatCustomers = [...bookingCountByCustomer.values()].filter((c) => c > 1).length;
  const repeatRate = activeCustomers === 0 ? 0 : (repeatCustomers / activeCustomers) * 100;

  const ratedBookings = bookings.filter((b) => typeof b.csatRating === "number");
  const csat = ratedBookings.length
    ? ratedBookings.reduce((s, b) => s + (b.csatRating ?? 0), 0) / ratedBookings.length
    : 0;

  const { occupancyRate } = computeDashboardMetrics(bookings, orders, notifications, rooms, BEVERAGES, TODAY_ISO);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <SectionHeader
          icon={<Radio className="h-4 w-4 text-blue-600" />}
          title="ข้อมูลจริงจากแอป Smart Space"
          subtitle="ต่างจากหน้าอื่นในแดชบอร์ดนี้ — หน้านี้อ่านข้อมูลจริงจากลูกค้าและการจองในแอป ไม่ใช่ข้อมูลจำลอง"
        />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Total Customers" value={String(totalCustomers)} />
        <MetricCard
          label="New Registration Rate"
          value={`${registrationRate >= 0 ? "+" : ""}${registrationRate.toFixed(1)}%`}
          delta={registrationRate}
          caption="MoM"
        />
        <MetricCard
          label="Active Users & Repeat Rate"
          value={`${repeatRate.toFixed(0)}%`}
          caption={`${repeatCustomers} of ${activeCustomers} active customers`}
        />
        <MetricCard label="CSAT" value={csat.toFixed(1)} caption="Average post-booking rating (out of 5)" />
        <MetricCard
          label="Space Occupancy Rate"
          value={`${occupancyRate.toFixed(1)}%`}
          caption="Booked room-hours, last 30 days"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <OccupancyHeatmap bookings={bookings} rooms={rooms} />
        <ZonePieChart bookings={bookings} zones={zones} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ConversionLineChart notifications={notifications} />
        <SentimentTopicSummary reviews={reviews} />
      </div>
    </div>
  );
}
