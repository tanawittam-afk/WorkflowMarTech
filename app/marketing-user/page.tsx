import type { Metadata } from "next";
import { Anuphan } from "next/font/google";

import { RoleGuard } from "@/components/layout/role-guard";

import MarketingUser from "./marketing-user";

// Thai-capable sans for this route only — Bricolage/Inter (loaded in the root
// layout) have no Thai glyphs, so Thai text falls back to Anuphan.
const anuphan = Anuphan({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-anuphan",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Marketing User — CDP Dashboard",
  description:
    "Customer Data Platform ของ Smart Space — แดชบอร์ดนักการตลาดพร้อมระบบจำลองการจองของลูกค้า: 8 Core KPIs, Occupancy Heatmap, Dynamic Pricing, Churn Win-Back และ AI Smart Bundling",
};

export default function MarketingUserPage() {
  return (
    <RoleGuard requiredRole="marketing">
      <MarketingUser fontClass={anuphan.variable} />
    </RoleGuard>
  );
}
