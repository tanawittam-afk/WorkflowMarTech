"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, TrendingUp, X, XCircle } from "lucide-react";
import { toast } from "sonner";

import { type AppState } from "../lib/domain";
import { type Action } from "../lib/reducer";
import { fmtBaht } from "./primitives";

/**
 * V2's Human-in-the-loop gate — every marketer action from any page lands
 * here `pending` first. Nothing fires until a human clicks "อนุมัติ".
 * Approved proposals stay listed with an Impact Tracker line comparing the
 * original estimate to the combined Total Sales(30d) delta measured live
 * since approval.
 */
export function ApprovalDrawer({
  open,
  onClose,
  state,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  state: AppState;
  dispatch: React.Dispatch<Action>;
}) {
  const pending = state.proposals.filter((p) => p.status === "pending");
  const approved = state.proposals.filter((p) => p.status === "approved");

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-[1px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900" style={{ fontFamily: "var(--font-bricolage), var(--font-anuphan), sans-serif" }}>
                  รออนุมัติ
                </h2>
                <p className="text-[11px] text-slate-400">ทุกแคมเปญต้องผ่านคนอนุมัติก่อนมีผลจริง</p>
              </div>
              <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {pending.length === 0 && approved.length === 0 ? (
                <p className="pt-8 text-center text-xs text-slate-400">ยังไม่มีข้อเสนอ — กด &ldquo;ส่งอนุมัติ&rdquo; จากหน้าไหนก็ได้</p>
              ) : null}

              {pending.length > 0 ? (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    รอการอนุมัติ ({pending.length})
                  </p>
                  <div className="space-y-2">
                    {pending.map((p) => (
                      <div key={p.id} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900">{p.title}</p>
                          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">{p.detail}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <p className="text-slate-400">กลุ่มเป้าหมาย</p>
                            <p className="font-semibold text-slate-700">{p.targetCount} รายการ</p>
                          </div>
                          <div>
                            <p className="text-slate-400">คาดการณ์เพิ่ม</p>
                            <p className="font-semibold text-emerald-700">+{fmtBaht(p.estRevenueLift)}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              dispatch({ type: "approveProposal", id: p.id });
                              toast.success(`อนุมัติแล้ว: ${p.title}`);
                            }}
                            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-blue-600 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                          >
                            <Check className="h-3.5 w-3.5" /> อนุมัติ
                          </button>
                          <button
                            type="button"
                            onClick={() => dispatch({ type: "rejectProposal", id: p.id })}
                            className="flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            <XCircle className="h-3.5 w-3.5" /> ปฏิเสธ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {approved.length > 0 ? (
                <div>
                  <p className="mb-2 mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Impact Tracker — Active ({approved.length})
                  </p>
                  <div className="space-y-2">
                    {approved.map((p) => (
                      <div key={p.id} className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900">{p.title}</p>
                          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                            <TrendingUp className="h-3 w-3" /> Active
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                          ประมาณการ +{fmtBaht(p.estRevenueLift)} — ติดตามผล 2 สัปดาห์แล้วเทียบตัวเลขจริงในหน้าที่เกี่ยวข้อง
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
