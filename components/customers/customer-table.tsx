"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeChurnRisks } from "@/lib/analytics/churn";
import { TODAY_ISO } from "@/lib/store/booking-store";
import type { Booking, Customer, Review } from "@/lib/data/types";

const RISK_VARIANT = { Low: "success", Medium: "warning", High: "danger" } as const;

type SortKey = "customerId" | "name" | "age" | "occupation" | "income";

function SortableHead({
  label,
  sortKeyValue,
  onSort,
}: {
  label: string;
  sortKeyValue: SortKey;
  onSort: (key: SortKey) => void;
}) {
  return (
    <TableHead className="cursor-pointer select-none" onClick={() => onSort(sortKeyValue)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="size-3" />
      </span>
    </TableHead>
  );
}

export function CustomerTable({
  customers,
  bookings,
  reviews,
}: {
  customers: Customer[];
  bookings: Booking[];
  reviews: Review[];
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("customerId");
  const [sortAsc, setSortAsc] = useState(true);

  const churnByCustomer = useMemo(() => {
    const entries = computeChurnRisks(customers, bookings, reviews, TODAY_ISO);
    return new Map(entries.map((e) => [e.customerId, e]));
  }, [customers, bookings, reviews]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.customerId.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const dir = sortAsc ? 1 : -1;
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
  }, [customers, query, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink3" />
        <Input
          placeholder="Search by name, email, or ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead label="ID" sortKeyValue="customerId" onSort={toggleSort} />
            <SortableHead label="Name" sortKeyValue="name" onSort={toggleSort} />
            <TableHead>Gender</TableHead>
            <SortableHead label="Age" sortKeyValue="age" onSort={toggleSort} />
            <TableHead>Address</TableHead>
            <SortableHead label="Occupation" sortKeyValue="occupation" onSort={toggleSort} />
            <SortableHead label="Income" sortKeyValue="income" onSort={toggleSort} />
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Churn risk</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((c) => {
            const risk = churnByCustomer.get(c.customerId)?.risk ?? "Low";
            return (
              <TableRow key={c.customerId}>
                <TableCell className="font-mono">{c.customerId}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.gender}</TableCell>
                <TableCell>{c.age}</TableCell>
                <TableCell>{c.address}</TableCell>
                <TableCell>{c.occupation}</TableCell>
                <TableCell className="font-mono">฿{c.income.toLocaleString()}</TableCell>
                <TableCell className="font-mono">{c.phoneNumber}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>
                  <Badge variant={RISK_VARIANT[risk]}>{risk}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
