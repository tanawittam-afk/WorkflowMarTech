"use client";

import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBookingStore } from "@/lib/store/booking-store";
import { formatHour } from "@/lib/booking-helpers";

const STATUS_VARIANT = {
  upcoming: "default",
  "checked-in": "success",
  completed: "secondary",
  cancelled: "danger",
} as const;

export default function AccountPage() {
  const customerId = useBookingStore((s) => s.currentCustomerId);
  const customer = useBookingStore((s) => s.customers.find((c) => c.customerId === customerId));
  const allBookings = useBookingStore((s) => s.bookings);
  const zones = useBookingStore((s) => s.zones);

  const bookings = useMemo(
    () =>
      allBookings
        .filter((b) => b.customerId === customerId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allBookings, customerId]
  );

  if (!customer) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">My account</h1>
        <p className="mt-1 text-ink2">Your profile and booking history.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <dt className="text-ink3">LINE UID</dt>
            <dd className="font-mono text-ink">{customer.lineUid}</dd>
            <dt className="text-ink3">Name</dt>
            <dd className="text-ink">{customer.name}</dd>
            <dt className="text-ink3">Occupation</dt>
            <dd className="text-ink">{customer.occupation}</dd>
            <dt className="text-ink3">Email</dt>
            <dd className="text-ink">{customer.email}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{zones.find((z) => z.id === b.zoneId)?.shortName}</TableCell>
                  <TableCell>{b.date}</TableCell>
                  <TableCell>
                    {formatHour(b.startTime.slice(0, 2))} – {formatHour(b.endTime.slice(0, 2))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
