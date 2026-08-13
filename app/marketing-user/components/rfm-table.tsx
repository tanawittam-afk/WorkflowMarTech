"use client";

import { Send, Users } from "lucide-react";
import { toast } from "sonner";

import { type RfmRow, type RfmTier } from "../lib/analytics-v2";
import { COUPON_DISCOUNT, type AppState } from "../lib/domain";
import { type Action } from "../lib/reducer";
import { Card, fmtBaht, PersonaChip, SectionHeader } from "./primitives";

const TIER_STYLE: Record<RfmTier, string> = {
  VIP: "bg-violet-50 text-violet-700 ring-violet-200",
  Loyal: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Potential: "bg-sky-50 text-sky-700 ring-sky-200",
  "At-Risk": "bg-red-50 text-red-700 ring-red-200",
};

/** V2 §4.5 — RFM tiers with a per-row retention action, gated by approval. */
export function RfmTable({ rows, state, dispatch }: { rows: RfmRow[]; state: AppState; dispatch: React.Dispatch<Action> }) {
  const propose = (row: RfmRow) => {
    const alreadyOffered = state.couponOffers.includes(row.uid);
    const alreadyProposed = state.proposals.some(
      (p) => p.status === "pending" && p.payload.kind === "coupon" && p.payload.uids.includes(row.uid),
    );
    if (alreadyOffered || alreadyProposed) return;
    dispatch({
      type: "propose",
      proposal: {
        title: `Win-back Coupon — ${row.name}`,
        type: "retention",
        detail: `${row.retentionAction} (RFM tier: ${row.tier})`,
        targetCount: 1,
        discountPct: Math.round(COUPON_DISCOUNT * 100),
        estRevenueLift: Math.round(row.monetary * 0.3),
        payload: { kind: "coupon", uids: [row.uid] },
      },
    });
    toast.info(`เสนอ Win-back Coupon ให้ ${row.name} แล้ว — รออนุมัติ`);
  };

  return (
    <Card className="p-4">
      <SectionHeader
        icon={<Users className="h-4 w-4" />}
        title="RFM Segmentation — Recency · Frequency · Monetary"
        subtitle="แยกลูกค้าเป็น 4 กลุ่มจากพฤติกรรมจริง พร้อม Retention Action ต่อกลุ่ม"
      />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead>
            <tr className="border-b border-cdp-border text-[10px] uppercase tracking-wide text-cdp-ink3">
              <th className="pb-2 pr-2 font-semibold">ลูกค้า</th>
              <th className="pb-2 pr-2 font-semibold">Tier</th>
              <th className="pb-2 pr-2 font-semibold">R / F / M</th>
              <th className="pb-2 pr-2 font-semibold">ยอดสะสม</th>
              <th className="pb-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const pending =
                state.couponOffers.includes(row.uid) ||
                state.proposals.some(
                  (p) => p.status === "pending" && p.payload.kind === "coupon" && p.payload.uids.includes(row.uid),
                );
              return (
                <tr key={row.uid} className="border-b border-cdp-border last:border-0">
                  <td className="py-2.5 pr-2">
                    <p className="font-semibold text-cdp-ink">{row.name}</p>
                    <PersonaChip persona={row.persona} />
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${TIER_STYLE[row.tier]}`}>
                      {row.tier}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums text-cdp-ink3">
                    {row.rScore}/{row.fScore}/{row.mScore}
                  </td>
                  <td className="py-2.5 pr-2 font-semibold tabular-nums text-cdp-ink2">{fmtBaht(row.monetary)}</td>
                  <td className="py-2.5">
                    {row.tier === "VIP" ? (
                      <span className="text-[11px] text-cdp-ink3">รักษาระดับ</span>
                    ) : pending ? (
                      <span className="text-[11px] text-cdp-ink3">ส่งแล้ว / รออนุมัติ</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => propose(row)}
                        className="inline-flex items-center gap-1 rounded-md bg-cdp-accent px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-cdp-accent-strong"
                      >
                        <Send className="h-3.5 w-3.5" />
                        เสนอ {row.tier === "At-Risk" ? "Win-back" : "Bundle"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
