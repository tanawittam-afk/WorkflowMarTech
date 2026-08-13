"use client";

import { GitBranch } from "lucide-react";

import { BEV_BY_ID, BUNDLE_RULES } from "../lib/domain";
import { Card, SectionHeader } from "./primitives";

/** V2 §4.7 Page 4 — the Apriori output read as plain-Thai sentences. */
export function AssociationRulesTable() {
  return (
    <Card className="p-4">
      <SectionHeader
        icon={<GitBranch className="h-4 w-4" />}
        title="Market Basket Analysis — Association Rules"
        subtitle="ถ้าลูกค้าจอง (Antecedent) → มักจะสั่งตามด้วย (Consequent)"
      />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-xs">
          <thead>
            <tr className="border-b border-cdp-border text-[10px] uppercase tracking-wide text-cdp-ink3">
              <th className="pb-2 pr-2 font-semibold">ถ้าจอง (Antecedent)</th>
              <th className="pb-2 pr-2 font-semibold">มักสั่งตาม (Consequent)</th>
              <th className="pb-2 pr-2 font-semibold text-right">Lift</th>
              <th className="pb-2 font-semibold text-right">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {BUNDLE_RULES.map((rule) => {
              const bev = BEV_BY_ID.get(rule.bevId)!;
              return (
                <tr key={rule.id} className="border-b border-cdp-border last:border-0">
                  <td className="py-2.5 pr-2 text-cdp-ink2">
                    {rule.roomType} ({String(rule.hourFrom).padStart(2, "0")}:00–{String(rule.hourTo).padStart(2, "0")}:00)
                  </td>
                  <td className="py-2.5 pr-2 font-semibold text-cdp-ink">{bev.name}</td>
                  <td className="py-2.5 pr-2 text-right font-semibold tabular-nums text-amber-600">{rule.lift.toFixed(1)}x</td>
                  <td className="py-2.5 text-right tabular-nums text-cdp-ink3">{rule.confidence}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-cdp-ink3">
        Lift &gt; 1 หมายถึงสองรายการนี้ถูกซื้อคู่กันบ่อยกว่าที่ควรจะเป็นโดยบังเอิญ — ยิ่งสูง ยิ่งควรจับพ่วงเป็นดีลเดียวกัน
      </p>
    </Card>
  );
}
