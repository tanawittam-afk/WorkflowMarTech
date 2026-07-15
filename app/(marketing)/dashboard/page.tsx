"use client";

import { BeverageBarChart } from "@/components/dashboard/beverage-bar-chart";
import { BundlingPanel } from "@/components/dashboard/bundling-panel";
import { ChurnWinbackTable } from "@/components/dashboard/churn-winback-table";
import { ConversionLineChart } from "@/components/dashboard/conversion-line-chart";
import { GoalProgressRow } from "@/components/dashboard/goal-progress-row";
import { MetricCard } from "@/components/dashboard/metric-card";
import { OccupancyHeatmap } from "@/components/dashboard/occupancy-heatmap";
import { SentimentTopicSummary } from "@/components/dashboard/sentiment-topic-summary";
import { ZonePieChart } from "@/components/dashboard/zone-pie-chart";
import { MarketingTopbar } from "@/components/layout/marketing-topbar";
import { computeDashboardMetrics } from "@/lib/analytics/dashboard-metrics";
import { BEVERAGES } from "@/lib/data/mock-data";
import { TODAY_ISO, useBookingStore } from "@/lib/store/booking-store";

// Illustrative baseline for the MoM registration-growth card — this
// prototype has no historical monthly cohorts to compute a real trend from.
const LAST_MONTH_CUSTOMER_BASELINE = 16;

export default function DashboardPage() {
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

  const metrics = computeDashboardMetrics(bookings, orders, notifications, rooms, BEVERAGES, TODAY_ISO);

  return (
    <>
      <MarketingTopbar title="Marketing Tech Dashboard" />
      <div className="flex-1 p-6 md:p-10">
        <div className="flex flex-col gap-8">
          {/* Goal progress — 3 SMART goals vs. pre-CDP baseline */}
          <GoalProgressRow
            revenue30={metrics.revenue30}
            attachRate30={metrics.attachRate30}
            combinedAov30={metrics.combinedAov30}
          />

          {/* 8 core KPIs */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
              value={`${metrics.occupancyRate.toFixed(1)}%`}
              caption="Booked room-hours, last 30 days"
            />
            <MetricCard
              label="Combined AOV"
              value={`฿${Math.round(metrics.combinedAov30).toLocaleString()}`}
              caption="Room fee + in-room drinks, per booking"
            />
            <MetricCard
              label="Top Service"
              value={metrics.topBeverage ? metrics.topBeverage.name : "—"}
              caption={metrics.topBeverage ? `${metrics.topBeverage.qty} units ordered` : "No orders yet"}
            />
            <MetricCard
              label="LINE OA Conversion"
              value={`${metrics.lineOaConversionRate.toFixed(0)}%`}
              caption="Coupon clicks that led to check-in"
            />
          </div>

          {/* Space utilization */}
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <OccupancyHeatmap bookings={bookings} rooms={rooms} />
            <ZonePieChart bookings={bookings} zones={zones} />
          </div>

          {/* Beverage upsell */}
          <div className="grid gap-6 lg:grid-cols-2">
            <BeverageBarChart orders={orders} />
            <BundlingPanel />
          </div>

          {/* Churn win-back */}
          <ChurnWinbackTable customers={customers} bookings={bookings} reviews={reviews} />

          {/* MarTech performance & insights */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ConversionLineChart notifications={notifications} />
            <SentimentTopicSummary reviews={reviews} />
          </div>
        </div>
      </div>
    </>
  );
}
