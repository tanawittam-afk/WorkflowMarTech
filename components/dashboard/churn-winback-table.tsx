"use client";

import { useMemo } from "react";
import { AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeChurnRisks } from "@/lib/analytics/churn";
import { TODAY_ISO, useBookingStore } from "@/lib/store/booking-store";
import type { Booking, Customer, Review } from "@/lib/data/types";

const RISK_VARIANT = { High: "danger", Medium: "warning", Low: "success" } as const;

export function ChurnWinbackTable({
  customers,
  bookings,
  reviews,
}: {
  customers: Customer[];
  bookings: Booking[];
  reviews: Review[];
}) {
  const winBackSent = useBookingStore((s) => s.winBackSent);
  const sendWinBackCoupon = useBookingStore((s) => s.sendWinBackCoupon);

  const atRisk = useMemo(
    () =>
      computeChurnRisks(customers, bookings, reviews, TODAY_ISO)
        .filter((e) => e.risk !== "Low")
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 8),
    [customers, bookings, reviews]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-4 text-danger" />
          Churn Risk & Win-Back
        </CardTitle>
        <CardDescription>
          Simulated RFM-style scoring — sync a personalized LINE coupon to at-risk customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {atRisk.length === 0 ? (
          <p className="text-sm text-ink3">No customers currently at churn risk.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Last booking</TableHead>
                <TableHead>Avg CSAT</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {atRisk.map((e) => {
                const sent = winBackSent.includes(e.customerId);
                return (
                  <TableRow key={e.customerId}>
                    <TableCell>{e.name}</TableCell>
                    <TableCell>
                      {e.daysSinceLastBooking === null
                        ? "Never"
                        : e.daysSinceLastBooking < 0
                          ? "Upcoming"
                          : `${e.daysSinceLastBooking}d ago`}
                    </TableCell>
                    <TableCell>{e.avgCsat ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={RISK_VARIANT[e.risk]}>{e.risk}</Badge>
                    </TableCell>
                    <TableCell>
                      {sent ? (
                        <Badge variant="secondary">Coupon sent</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            sendWinBackCoupon(e.customerId);
                            toast.success(`Win-back LINE coupon sent to ${e.name}`);
                          }}
                        >
                          <Send className="size-3.5" />
                          Sync & Send
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
