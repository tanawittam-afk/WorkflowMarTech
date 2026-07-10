"use client";

import { useMemo, useState } from "react";

import { MarketingTopbar } from "@/components/layout/marketing-topbar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBookingStore } from "@/lib/store/booking-store";
import { formatHour } from "@/lib/booking-helpers";
import type { Booking } from "@/lib/data/types";

const STATUS_VARIANT = {
  upcoming: "default",
  "checked-in": "success",
  completed: "secondary",
  cancelled: "danger",
} as const;

const STATUS_FILTERS: (Booking["status"] | "all")[] = ["all", "upcoming", "checked-in", "completed", "cancelled"];

export default function BookingsPage() {
  const bookings = useBookingStore((s) => s.bookings);
  const customers = useBookingStore((s) => s.customers);
  const zones = useBookingStore((s) => s.zones);
  const rooms = useBookingStore((s) => s.rooms);

  const [statusFilter, setStatusFilter] = useState<Booking["status"] | "all">("all");

  const sorted = useMemo(() => {
    const filtered =
      statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter);
    return [...filtered].sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  }, [bookings, statusFilter]);

  return (
    <>
      <MarketingTopbar title="Bookings" />
      <div className="flex-1 p-6 md:p-10">
        <div className="flex flex-col gap-4">
          <div className="max-w-[180px]">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All statuses" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Zone / Room</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CSAT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((b) => {
                const customer = customers.find((c) => c.customerId === b.customerId);
                const zone = zones.find((z) => z.id === b.zoneId);
                const room = rooms.find((r) => r.id === b.roomId);
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono">{b.id}</TableCell>
                    <TableCell>{customer?.name ?? b.customerId}</TableCell>
                    <TableCell>
                      {zone?.shortName} · {room?.name}
                    </TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>
                      {formatHour(b.startTime.slice(0, 2))} – {formatHour(b.endTime.slice(0, 2))}
                    </TableCell>
                    <TableCell className="font-mono">฿{b.amountPaid}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge>
                    </TableCell>
                    <TableCell>{b.csatRating ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
