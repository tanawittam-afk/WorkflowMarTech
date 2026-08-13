"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgePercent,
  Banknote,
  Bell,
  CalendarCheck,
  CheckCircle2,
  DoorOpen,
  Minus,
  MonitorSmartphone,
  Plus,
  QrCode,
  Sparkles,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import {
  BEV_BY_ID,
  BEVERAGES,
  BUNDLE_DISCOUNT,
  BUNDLE_RULES,
  COUPON_DISCOUNT,
  CUSTOMER_BY_UID,
  CUSTOMERS,
  OFF_PEAK_HOURS,
  priceFor,
  ROOM_BY_ID,
  ROOMS,
  type AppState,
  type BundleRule,
  type OrderLine,
} from "../lib/domain";
import { type Action } from "../lib/reducer";
import { Card, fmtBaht, PersonaChip, SectionHeader } from "./primitives";

export type SimStep = "customer" | "room" | "inroom" | "checkout" | "done";

export interface SimBooking {
  bookingId: string;
  customerUid: string;
  roomId: number;
  hour: number;
  duration: number;
  roomAmount: number;
  usedCoupon: boolean;
  bundleLine?: OrderLine & { discounted: number };
}

let simSeq = 1;

export function Simulator({
  state,
  dispatch,
  onGoDashboard,
}: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onGoDashboard: () => void;
}) {
  const [step, setStep] = useState<SimStep>("customer");
  const [customerUid, setCustomerUid] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [duration, setDuration] = useState(2);
  const [bundleOffer, setBundleOffer] = useState<BundleRule | null>(null);
  const [booking, setBooking] = useState<SimBooking | null>(null);
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [rating, setRating] = useState(5);

  const customer = customerUid ? CUSTOMER_BY_UID.get(customerUid)! : null;
  const room = roomId ? ROOM_BY_ID.get(roomId)! : null;
  const hasCoupon = customerUid ? state.couponOffers.includes(customerUid) : false;

  const reset = () => {
    setStep("customer");
    setCustomerUid(null);
    setRoomId(null);
    setHour(null);
    setDuration(2);
    setBundleOffer(null);
    setBooking(null);
    setCart([]);
    setRating(5);
  };

  const confirmBooking = (acceptBundle: boolean) => {
    if (!customer || !room || hour === null) return;
    const unit = priceFor(room, hour, state.dynamicPricing);
    let roomAmount = unit * duration;
    if (hasCoupon) roomAmount = Math.round(roomAmount * (1 - COUPON_DISCOUNT));

    const bookingId = `SIM${String(simSeq++).padStart(3, "0")}`;
    let bundleLine: SimBooking["bundleLine"];
    if (acceptBundle && bundleOffer) {
      const bev = BEV_BY_ID.get(bundleOffer.bevId)!;
      bundleLine = { bevId: bev.id, qty: 1, discounted: Math.round(bev.price * (1 - BUNDLE_DISCOUNT)) };
    }
    const sim: SimBooking = {
      bookingId,
      customerUid: customer.uid,
      roomId: room.id,
      hour,
      duration,
      roomAmount,
      usedCoupon: hasCoupon,
      bundleLine,
    };
    setBooking(sim);
    setBundleOffer(null);
    if (bundleLine) setCart([{ bevId: bundleLine.bevId, qty: bundleLine.qty }]);
    dispatch({
      type: "simBook",
      customerName: customer.name,
      booking: {
        id: bookingId,
        customerId: customer.uid,
        roomId: room.id,
        dayOffset: 0,
        hour,
        duration,
        amount: roomAmount,
        isNew: true,
        usedCoupon: hasCoupon,
      },
    });
    toast.success(`จองสำเร็จ! ${room.name} เวลา ${String(hour).padStart(2, "0")}:00 (${duration} ชม.) — ชำระรอบที่ 1 ${fmtBaht(roomAmount)}`);
    setStep("inroom");
  };

  const tryConfirm = () => {
    if (!room || hour === null) return;
    const matched = BUNDLE_RULES.find(
      (r) =>
        state.activeBundles.includes(r.id) &&
        r.roomType === room.type &&
        hour >= r.hourFrom &&
        hour <= r.hourTo,
    );
    if (matched) setBundleOffer(matched);
    else confirmBooking(false);
  };

  const addToCart = (bevId: string, delta: number) => {
    setCart((prev) => {
      const next = prev
        .map((l) => (l.bevId === bevId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0);
      if (delta > 0 && !prev.some((l) => l.bevId === bevId)) next.push({ bevId, qty: 1 });
      return next;
    });
  };

  const bevTotal = cart.reduce((s, l) => {
    if (booking?.bundleLine && l.bevId === booking.bundleLine.bevId) {
      const bev = BEV_BY_ID.get(l.bevId)!;
      return s + booking.bundleLine.discounted + bev.price * (l.qty - 1);
    }
    return s + BEV_BY_ID.get(l.bevId)!.price * l.qty;
  }, 0);

  const checkout = () => {
    if (!booking || !customer) return;
    dispatch({
      type: "simCheckout",
      bookingId: booking.bookingId,
      lines: cart,
      rating,
      customerName: customer.name,
    });
    toast.success(`เช็กเอาต์สำเร็จ — บิลรวม ${fmtBaht(booking.roomAmount + bevTotal)} ถูกบันทึกเข้า CDP แล้ว`);
    setStep("done");
  };

  const steps: Array<{ id: SimStep; label: string }> = [
    { id: "customer", label: "1 เลือกลูกค้า" },
    { id: "room", label: "2 จองห้อง (รอบ 1)" },
    { id: "inroom", label: "3 สั่งน้ำผ่าน QR" },
    { id: "checkout", label: "4 เช็กเอาต์ (รอบ 2)" },
  ];
  const stepIdx = steps.findIndex((s) => s.id === step);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader
            icon={<MonitorSmartphone className="h-4 w-4" />}
            title="Customer Booking Simulator"
            subtitle="จำลองลูกค้าจริง 1 คน เดินครบทั้ง Journey — ทุกธุรกรรมวิ่งเข้า CDP และขยับแดชบอร์ดทันที"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  step === "done"
                    ? "bg-emerald-50 text-emerald-600"
                    : i === stepIdx
                      ? "bg-blue-600 text-white"
                      : i < stepIdx
                        ? "bg-blue-50 text-blue-600"
                        : "bg-slate-100 text-slate-400"
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Step 1 — pick a customer */}
      {step === "customer" ? (
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-600">เลือกลูกค้าที่จะสวมบทบาท (dim_customers · 15 คน)</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CUSTOMERS.map((c) => {
              const coupon = state.couponOffers.includes(c.uid);
              return (
                <button
                  key={c.uid}
                  type="button"
                  onClick={() => {
                    setCustomerUid(c.uid);
                    setStep("room");
                  }}
                  className="group rounded-lg border border-slate-200 bg-white p-3 text-left transition-all hover:border-blue-400 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800">{c.name}</p>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-blue-600" />
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {c.occupation} · อายุ {c.age} · LINE UID {c.uid.slice(0, 6)}…
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <PersonaChip persona={c.persona} />
                    {coupon ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 ring-1 ring-red-200">
                        <BadgePercent className="h-3 w-3" /> มีคูปอง -15%
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      ) : null}

      {/* Step 2 — book a room */}
      {step === "room" && customer ? (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-600">
              จองห้องให้ <span className="text-blue-700">{customer.name}</span>{" "}
              {hasCoupon ? <span className="font-bold text-red-600">(คูปอง Win-Back -15% จะถูกใช้อัตโนมัติ)</span> : null}
            </p>
            <button type="button" onClick={reset} className="text-[11px] font-medium text-slate-400 hover:text-slate-600">
              ← เปลี่ยนลูกค้า
            </button>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-500">เลือกห้อง (ราคา/ชม.)</p>
              <div className="grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3">
                {ROOMS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoomId(r.id)}
                    className={`rounded-lg border p-2 text-left text-[11px] transition-colors ${
                      roomId === r.id
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-300"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <p className="font-bold text-slate-800">{r.name}</p>
                    <p className="text-slate-400">
                      {r.size === "small" ? "เล็ก" : r.size === "medium" ? "กลาง" : "ใหญ่"} · {fmtBaht(r.rate)}/ชม.
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-500">เลือกเวลาเริ่ม (วันนี้)</p>
              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: 16 }, (_, i) => i + 8).map((h) => {
                  const discounted = state.dynamicPricing && OFF_PEAK_HOURS.has(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHour(h)}
                      className={`rounded-md border px-1 py-1.5 text-center text-[11px] font-semibold transition-colors ${
                        hour === h
                          ? "border-blue-500 bg-blue-600 text-white"
                          : discounted
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                      }`}
                    >
                      {String(h).padStart(2, "0")}:00
                      {discounted ? <span className="block text-[9px] font-bold">-18%</span> : null}
                    </button>
                  );
                })}
              </div>
              <p className="mb-1.5 mt-3 text-[11px] font-semibold text-slate-500">ระยะเวลา</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`rounded-md border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      duration === d
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                    }`}
                  >
                    {d} ชม.
                  </button>
                ))}
              </div>

              {room && hour !== null ? (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                  <p className="flex justify-between text-slate-600">
                    <span>
                      {room.name} · {String(hour).padStart(2, "0")}:00 · {duration} ชม.
                    </span>
                    <span className="font-semibold tabular-nums">
                      {fmtBaht(priceFor(room, hour, state.dynamicPricing) * duration)}
                    </span>
                  </p>
                  {state.dynamicPricing && OFF_PEAK_HOURS.has(hour) ? (
                    <p className="mt-1 text-[10px] font-semibold text-emerald-600">
                      ✓ Dynamic Pricing: ช่วง Off-Peak ลดแล้ว 18% (ปกติ {fmtBaht(room.rate * duration)})
                    </p>
                  ) : null}
                  {hasCoupon ? (
                    <p className="mt-1 text-[10px] font-semibold text-red-600">
                      ✓ คูปอง Win-Back จาก LINE OA: ลดเพิ่ม 15% → ชำระจริง{" "}
                      {fmtBaht(Math.round(priceFor(room, hour, state.dynamicPricing) * duration * (1 - COUPON_DISCOUNT)))}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={tryConfirm}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
                  >
                    <CalendarCheck className="h-4 w-4" /> ยืนยันจอง + ชำระเงินรอบที่ 1
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-slate-400">เลือกห้องและเวลาเริ่มเพื่อดูสรุปราคา</p>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      {/* Bundle pop-up (Smart Bundling on the booking confirm page) */}
      <AnimatePresence>
        {bundleOffer ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
            onClick={() => confirmBooking(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 12 }}
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-blue-600">
                <Sparkles className="h-5 w-5" />
                <p className="text-sm font-bold">ดีลพ่วงพิเศษสำหรับคุณ!</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                ลูกค้าที่จอง <b>{bundleOffer.roomType}</b> ช่วงเวลานี้มักสั่ง{" "}
                <b>{BEV_BY_ID.get(bundleOffer.bevId)!.name}</b> — รับส่วนลดพ่วง <b className="text-red-600">15%</b>{" "}
                เหลือ {fmtBaht(Math.round(BEV_BY_ID.get(bundleOffer.bevId)!.price * (1 - BUNDLE_DISCOUNT)))} (ปกติ{" "}
                {fmtBaht(BEV_BY_ID.get(bundleOffer.bevId)!.price)})
              </p>
              <p className="mt-1.5 text-[10px] text-slate-400">
                จากกฎ Apriori: Lift {bundleOffer.lift.toFixed(1)} · Confidence {bundleOffer.confidence}%
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => confirmBooking(true)}
                  className="flex-1 rounded-md bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  รับดีลพ่วง +จองเลย
                </button>
                <button
                  type="button"
                  onClick={() => confirmBooking(false)}
                  className="flex-1 rounded-md border border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  ไม่รับ จองอย่างเดียว
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Step 3 — in-room QR ordering */}
      {step === "inroom" && booking && customer && room ? (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-600">
              <span className="text-blue-700">{customer.name}</span> เช็กอินเข้า {room.name} แล้ว — สแกน QR ในห้องเพื่อสั่งเครื่องดื่ม
              (จ่ายรอบเดียวตอนเช็กเอาต์ ฟีลตี๋น้อย)
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
              <QrCode className="h-3.5 w-3.5" /> Booking {booking.bookingId}
            </span>
          </div>

          {booking.duration >= 2 && cart.length === 0 ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
              <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                <b>Trigger อัตโนมัติทำงาน:</b> จองเกิน 2 ชม. แต่ยังไม่มีออเดอร์ — ระบบยิงคูปอง
                “ประชุมเหนื่อยไหม? สแกนสั่งกาแฟตอนนี้ลด 20%” เข้า LINE ของ {customer.name} แล้ว
              </p>
            </div>
          ) : null}

          <div className="mt-3 grid gap-3 md:grid-cols-[1.3fr_1fr]">
            <div className="grid grid-cols-2 gap-1.5">
              {BEVERAGES.map((b) => {
                const line = cart.find((l) => l.bevId === b.id);
                const recommended = b.personas.includes(customer.persona);
                return (
                  <div
                    key={b.id}
                    className={`rounded-lg border p-2.5 ${
                      line ? "border-blue-400 bg-blue-50/60" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[11px] font-bold text-slate-800">{b.name}</p>
                      {recommended ? (
                        <span className="rounded bg-amber-50 px-1 text-[9px] font-bold text-amber-600 ring-1 ring-amber-200">
                          แนะนำ
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-slate-400">{fmtBaht(b.price)}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`ลด ${b.name}`}
                        onClick={() => addToCart(b.id, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-4 text-center text-xs font-bold tabular-nums text-slate-700">{line?.qty ?? 0}</span>
                      <button
                        type="button"
                        aria-label={`เพิ่ม ${b.name}`}
                        onClick={() => addToCart(b.id, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-bold text-slate-600">บิลค่าน้ำสะสม (fact_billings)</p>
              {cart.length === 0 ? (
                <p className="mt-2 flex-1 text-[11px] text-slate-400">ยังไม่มีออเดอร์ — กด + เพื่อสั่ง</p>
              ) : (
                <ul className="mt-2 flex-1 space-y-1 text-[11px] text-slate-600">
                  {cart.map((l) => {
                    const bev = BEV_BY_ID.get(l.bevId)!;
                    const isBundle = booking.bundleLine?.bevId === l.bevId;
                    return (
                      <li key={l.bevId} className="flex justify-between">
                        <span>
                          {bev.name} × {l.qty}
                          {isBundle ? <span className="ml-1 font-bold text-red-500">(ดีลพ่วง -15%)</span> : null}
                        </span>
                        <span className="tabular-nums">
                          {fmtBaht(
                            isBundle
                              ? booking.bundleLine!.discounted + bev.price * (l.qty - 1)
                              : bev.price * l.qty,
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-2 border-t border-slate-200 pt-2 text-xs font-bold text-slate-800">
                <p className="flex justify-between">
                  <span>รวมรอบที่ 2</span>
                  <span className="tabular-nums">{fmtBaht(bevTotal)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep("checkout")}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-slate-800 py-2 text-xs font-bold text-white hover:bg-slate-900"
              >
                <DoorOpen className="h-4 w-4" /> ใช้งานเสร็จ → ไปเช็กเอาต์
              </button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Step 4 — checkout */}
      {step === "checkout" && booking && customer && room ? (
        <Card className="mx-auto max-w-md p-5">
          <SectionHeader
            icon={<Banknote className="h-4 w-4" />}
            title="เช็กเอาต์ — สรุปบิลรวม 2 รอบ"
            subtitle={`ผูกเข้า Customer ID เดียวกัน: ${customer.uid}`}
          />
          <div className="mt-3 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="flex justify-between">
              <span>
                รอบ 1 · ค่าห้อง {room.name} ({booking.duration} ชม.)
                {booking.usedCoupon ? <span className="ml-1 font-bold text-red-500">ใช้คูปอง -15%</span> : null}
              </span>
              <span className="font-semibold tabular-nums">{fmtBaht(booking.roomAmount)}</span>
            </p>
            <p className="flex justify-between">
              <span>รอบ 2 · ค่าเครื่องดื่ม ({cart.reduce((s, l) => s + l.qty, 0)} รายการ)</span>
              <span className="font-semibold tabular-nums">{fmtBaht(bevTotal)}</span>
            </p>
            <p className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-slate-900">
              <span>ยอดรวมสุทธิ (AOV ต่อบิล)</span>
              <span className="tabular-nums">{fmtBaht(booking.roomAmount + bevTotal)}</span>
            </p>
          </div>
          <p className="mt-4 text-[11px] font-semibold text-slate-500">ให้คะแนนความพึงพอใจ (CSAT)</p>
          <div className="mt-1.5 flex gap-1">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                aria-label={`ให้ ${r} ดาว`}
                onClick={() => setRating(r)}
                className="p-0.5"
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    r <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                  }`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={checkout}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <CheckCircle2 className="h-4 w-4" /> ชำระเงินรอบที่ 2 + เช็กเอาต์
          </button>
        </Card>
      ) : null}

      {/* Done */}
      {step === "done" && booking && customer ? (
        <Card className="mx-auto max-w-md p-6 text-center">
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          </motion.div>
          <h3
            className="mt-3 text-base font-bold text-slate-900"
            style={{ fontFamily: "var(--font-bricolage), var(--font-anuphan), sans-serif" }}
          >
            Journey ครบลูป — ข้อมูลเข้า CDP แล้ว
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            การจองของ {customer.name} (รอบ 1 {fmtBaht(booking.roomAmount)} + รอบ 2 {fmtBaht(bevTotal)}) ถูกผูกเข้า
            LINE UID เดียวกันและอัปเดต KPIs, Goal Progress, Heatmap และ Activity Log บนแดชบอร์ดเรียบร้อย
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onGoDashboard}
              className="flex-1 rounded-md bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700"
            >
              ดูผลบนแดชบอร์ด →
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-md border border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              จำลองลูกค้าคนถัดไป
            </button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

/* ============================================================
   Main
   ============================================================ */

