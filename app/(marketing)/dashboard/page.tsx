"use client";

import { MarketingTopbar } from "@/components/layout/marketing-topbar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { OccupancyBarChart } from "@/components/dashboard/occupancy-bar-chart";
import { ZonePieChart } from "@/components/dashboard/zone-pie-chart";
import { ConversionLineChart } from "@/components/dashboard/conversion-line-chart";
import { SentimentTopicSummary } from "@/components/dashboard/sentiment-topic-summary";
import { useBookingStore } from "@/lib/store/booking-store";

// Illustrative baseline for the MoM registration-growth card — this
// prototype has no historical monthly cohorts to compute a real trend from.
const LAST_MONTH_CUSTOMER_BASELINE = 16;

export default function DashboardPage() {
  const customers = useBookingStore((s) => s.customers);
  const bookings = useBookingStore((s) => s.bookings);
  const zones = useBookingStore((s) => s.zones);
  const reviews = useBookingStore((s) => s.reviews);
  const notifications = useBookingStore((s) => s.notifications);

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

  return (
    <>
      <MarketingTopbar title="Marketing Tech Dashboard" />
      <div className="flex-1 p-6 md:p-10">
        <div className="flex flex-col gap-8">
          {/* Row 1 — overview metrics */}
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
          </div>

          {/* Row 2 — space utilization */}
          <div className="grid gap-6 lg:grid-cols-2">
            <OccupancyBarChart bookings={bookings} />
            <ZonePieChart bookings={bookings} zones={zones} />
          </div>

          {/* Row 3 — MarTech performance & insights */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ConversionLineChart notifications={notifications} />
            <SentimentTopicSummary reviews={reviews} />
          </div>
        </div>
      </div>
    </>
  );
}
