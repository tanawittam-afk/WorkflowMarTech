"use client";

import { CheckCircle2, Flame, Send } from "lucide-react";
import { toast } from "sonner";

import { type Metrics } from "../lib/metrics";
import { type Action } from "../lib/reducer";
import { Card, fmtBaht, PersonaChip, SectionHeader } from "./primitives";

export function ChurnTable({ m, dispatch }: { m: Metrics; dispatch: React.Dispatch<Action> }) {
  return (
    <Card className="flex h-full flex-col p-4">
      <SectionHeader
        icon={<Flame className="h-4 w-4" />}
        title="VIP Churn Risk — กดส่งคูปองดึงกลับได้ทันที"
        subtitle="ลูกค้า Risk ≥ 80% (หายไปเกิน ~25 วัน) จากโมเดล Cluster Analysis — ไม่ต้อง Export ไฟล์"
      />
      {m.churnRows.length === 0 ? (
        <div className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 p-6 text-center text-xs text-emerald-700">
          🎉 ไม่มีลูกค้ากลุ่มเสี่ยงเหลืออยู่ — ทุกคนกลับมาจองแล้ว
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[460px] text-left text-xs">
            <thead>
              <tr className="border-b border-cdp-border text-[10px] uppercase tracking-wide text-cdp-ink3">
                <th className="pb-2 pr-2 font-semibold">ลูกค้า</th>
                <th className="pb-2 pr-2 font-semibold">ยอดสะสม</th>
                <th className="pb-2 pr-2 font-semibold">ล่าสุด</th>
                <th className="pb-2 pr-2 font-semibold">Churn Risk</th>
                <th className="pb-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {m.churnRows.map((row) => (
                <tr key={row.uid} className="border-b border-cdp-border last:border-0">
                  <td className="py-2.5 pr-2">
                    <p className="font-semibold text-cdp-ink">{row.name}</p>
                    <PersonaChip persona={row.persona} />
                  </td>
                  <td className="py-2.5 pr-2 font-semibold tabular-nums text-cdp-ink2">{fmtBaht(row.monetary)}</td>
                  <td className="py-2.5 pr-2 text-cdp-ink3">{row.recency} วันก่อน</td>
                  <td className="py-2.5 pr-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 ring-1 ring-red-200">
                      <Flame className="h-3 w-3" />
                      {row.risk}%
                    </span>
                  </td>
                  <td className="py-2.5">
                    {row.couponSent ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" /> ส่งคูปองแล้ว
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          dispatch({ type: "sendCoupon", uid: row.uid });
                          toast.success(`ส่งสำเร็จ: คูปองส่วนลด 15% ถูกยิงตรงเข้า LINE ของ ${row.name} แล้ว!`);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-cdp-accent px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-cdp-accent-strong"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Sync & Send คูปองเข้า LINE OA
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-[10px] text-cdp-ink3">
        เคล็ดลับ: ส่งคูปองแล้วไปที่แท็บ「จำลองการจองของลูกค้า」เลือกลูกค้าคนเดิมเพื่อดูคูปองถูกใช้จริง —
        LINE OA Conversion จะขยับทันที
      </p>
    </Card>
  );
}

/* ============================================================
   Dashboard — AI smart bundling suggestions
   ============================================================ */

