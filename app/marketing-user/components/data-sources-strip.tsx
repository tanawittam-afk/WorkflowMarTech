"use client";

import { CreditCard, Database, MessageCircleMore, QrCode, Star } from "lucide-react";

import { Card, SectionHeader } from "./primitives";

const SOURCES = [
  { icon: MessageCircleMore, name: "LINE OA", detail: "สมัครสมาชิก · Profile Data" },
  { icon: Database, name: "Web Booking", detail: "จองห้อง · fact_bookings" },
  { icon: QrCode, name: "In-Room QR", detail: "สั่งเครื่องดื่ม · fact_billings" },
  { icon: CreditCard, name: "Payment / POS", detail: "ชำระเงินรวม · billing" },
  { icon: Star, name: "CSAT", detail: "แบบสอบถามหลังใช้บริการ" },
] as const;

/** Proposal_V2 — 5 ingestion touchpoints, all joined by one LINE UID. */
export function DataSourcesStrip() {
  return (
    <Card className="p-4">
      <SectionHeader
        icon={<Database className="h-4 w-4 text-blue-600" />}
        title="Data Source · 5 จุดนำเข้าข้อมูล"
        subtitle="เชื่อมทุกจุดด้วย Customer ID (LINE UID) เดียว"
      />
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {SOURCES.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.name} className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-slate-800">{s.name}</p>
              <p className="text-[10px] leading-tight text-slate-400">{s.detail}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
