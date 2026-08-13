"use client";

import { Bell, Check, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { BEV_BY_ID, BUNDLE_RULES, type AppState } from "../lib/domain";
import { type Action } from "../lib/reducer";
import { Card, SectionHeader } from "./primitives";

export function BundlePanel({ state, dispatch }: { state: AppState; dispatch: React.Dispatch<Action> }) {
  return (
    <Card className="flex h-full flex-col p-4">
      <SectionHeader
        icon={<Sparkles className="h-4 w-4" />}
        title="AI Smart Bundling Suggestions"
        subtitle="กฎความสัมพันธ์จากโมเดล Market Basket (Apriori) — เปิดดีลบนหน้าเว็บจองได้ในคลิกเดียว"
      />
      <div className="mt-3 space-y-3">
        {BUNDLE_RULES.map((rule) => {
          const bev = BEV_BY_ID.get(rule.bevId)!;
          const active = state.activeBundles.includes(rule.id);
          const pending = state.proposals.some(
            (p) => p.status === "pending" && p.payload.kind === "bundle" && p.payload.ruleId === rule.id,
          );
          return (
            <div
              key={rule.id}
              className={`rounded-lg border p-3 transition-colors ${
                active ? "border-emerald-300 bg-emerald-50/60" : "border-cdp-border bg-cdp-surface-2/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-cdp-ink">
                    {rule.roomType} ({String(rule.hourFrom).padStart(2, "0")}:00–{String(rule.hourTo).padStart(2, "0")}:00) + {bev.name}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-cdp-ink3">{rule.pitch}</p>
                  <p className="mt-1 text-[10px] font-semibold text-cdp-ink3">
                    Lift <span className="text-amber-600">{rule.lift.toFixed(1)}</span> · Confidence{" "}
                    <span className="text-amber-600">{rule.confidence}%</span> · ส่วนลดพ่วง -15%
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (active) {
                      dispatch({ type: "toggleBundle", ruleId: rule.id });
                      toast(`ปิดดีล ${rule.roomType} + ${bev.name} แล้ว`);
                      return;
                    }
                    if (pending) return;
                    dispatch({
                      type: "propose",
                      proposal: {
                        title: `เปิดดีลพ่วง ${rule.roomType} + ${bev.name}`,
                        type: "bundle",
                        detail: `${rule.pitch} (Lift ${rule.lift.toFixed(1)}x, Confidence ${rule.confidence}%)`,
                        targetCount: rule.confidence,
                        discountPct: 15,
                        estRevenueLift: Math.round(bev.price * rule.lift * 8),
                        payload: { kind: "bundle", ruleId: rule.id },
                      },
                    });
                    toast.info(`เสนอเปิดดีล ${rule.roomType} + ${bev.name} แล้ว — รออนุมัติ`);
                  }}
                  className={`shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                    active
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-cdp-accent text-white hover:bg-cdp-accent-strong"
                  }`}
                >
                  {active ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Active บนเว็บ
                    </span>
                  ) : pending ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> รออนุมัติ
                    </span>
                  ) : (
                    "เสนอเปิดดีลบนเว็บ"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-cdp-accent/15 bg-cdp-accent-soft/60 px-3 py-2 text-[11px] text-cdp-accent-strong">
        <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Trigger อัตโนมัติในห้อง: ใช้งานเกิน 2 ชม. แต่ยังไม่มีบิลค่าน้ำ → ระบบยิงคูปองกาแฟ -20% เข้า LINE OA
          ของลูกค้าในห้องนั้นเองโดยไม่ต้องกดสั่ง
        </p>
      </div>
    </Card>
  );
}

/* ============================================================
   Dashboard — activity log
   ============================================================ */

