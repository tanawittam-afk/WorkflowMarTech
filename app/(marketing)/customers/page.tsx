"use client";

import { MarketingTopbar } from "@/components/layout/marketing-topbar";
import { CustomerTable } from "@/components/customers/customer-table";
import { useBookingStore } from "@/lib/store/booking-store";

export default function CustomersPage() {
  const customers = useBookingStore((s) => s.customers);
  const bookings = useBookingStore((s) => s.bookings);
  const reviews = useBookingStore((s) => s.reviews);

  return (
    <>
      <MarketingTopbar title="Customers" />
      <div className="flex-1 p-6 md:p-10">
        <CustomerTable customers={customers} bookings={bookings} reviews={reviews} />
      </div>
    </>
  );
}
