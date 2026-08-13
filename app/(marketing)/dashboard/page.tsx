"use client";

import Link from "next/link";
import { ArrowRight, LineChart } from "lucide-react";

import { ConversionLineChart } from "@/components/dashboard/conversion-line-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { OccupancyHeatmap } from "@/components/dashboard/occupancy-heatmap";
import { SentimentTopicSummary } from "@/components/dashboard/sentiment-topic-summary";
import { ZonePieChart } from "@/components/dashboard/zone-pie-chart";
import { MarketingTopbar } from "@/components/layout/marketing-topbar";
import { Card, CardContent } from "@/components/ui/card";
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

  const { occupancyRate } = computeDashboardMetrics(bookings, orders, notifications, rooms, BEVERAGES, TODAY_ISO);

  return (
    <>
      <MarketingTopbar title="Operations Dashboard" />
      <div className="flex-1 p-6 md:p-10">
        <div className="flex flex-col gap-8">
          {/* Real-time space & customer ops */}
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
              value={`${occupancyRate.toFixed(1)}%`}
              caption="Booked room-hours, last 30 days"
            />
          </div>

          {/* CDP callout — forecast, RFM segments & marketing actions live on the CDP Dashboard */}
          <Card variant="glass">
            <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent-strong">
                  <LineChart className="size-5" />
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold text-ink">
                    Looking for sales forecast, RFM segments or marketing actions?
                  </p>
                  <p className="text-sm text-ink3">
                    Those live on the CDP Dashboard — Total Sales forecast, customer retention tiers, and
                    beverage bundling in one place.
                  </p>
                </div>
              </div>
              <Link
                href="/marketing-user"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-semibold text-onaccent transition-colors hover:opacity-90"
              >
                Open CDP Dashboard <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>

          {/* Space utilization */}
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <OccupancyHeatmap bookings={bookings} rooms={rooms} />
            <ZonePieChart bookings={bookings} zones={zones} />
          </div>

          {/* Customer feedback & marketing performance */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ConversionLineChart notifications={notifications} />
            <SentimentTopicSummary reviews={reviews} />
          </div>
        </div>
      </div>
    </>
  );
}
