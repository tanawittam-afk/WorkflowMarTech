"use client";

/**
 * "Marketing User" — Customer Data Platform (CDP) dashboard prototype for
 * Smart Space (20 rented rooms + in-room QR beverage upsell, unified by
 * LINE UID). Self-contained single-file app following the /martech pattern:
 * mock data engine + simulated analytics models + every UI section live in
 * this file. Thai-only UI; technical vocabulary (AOV, Churn, KPI, Lift)
 * stays English. Light enterprise surface (white / blue-600) matching the
 * /martech workflow page — deliberately NOT the main app's dark-glass theme.
 *
 * Two tabs: (1) Marketer Analytics Dashboard — 3 SMART goal bars, 8 core
 * KPIs, 20×24 occupancy heatmap + dynamic-pricing toggle, service/beverage
 * charts, VIP churn win-back table, AI smart-bundling cards, activity log.
 * (2) Customer Booking Simulator — book a room, scan-order beverages
 * ("Teenoi-style" post-paid bill), check out; every commit dispatches into
 * the shared reducer so all dashboard numbers move in real time.
 *
 * All mock history is generated with a seeded PRNG at module scope so the
 * server prerender and client hydration always agree. Dates are stored as
 * relative day offsets ("X วันก่อน") — no absolute clock reads in render.
 */

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  Activity,
  ArrowRight,
  BadgePercent,
  Banknote,
  Bell,
  CalendarCheck,
  Check,
  CheckCircle2,
  Coffee,
  CupSoda,
  DoorOpen,
  Flame,
  GlassWater,
  LayoutDashboard,
  MessageCircleHeart,
  Minus,
  MonitorSmartphone,
  Plus,
  QrCode,
  Send,
  Sparkles,
  Star,
  ThermometerSun,
  TrendingUp,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* ============================================================
   Types
   ============================================================ */

type Persona = "student" | "pro" | "creator";
type RoomSize = "small" | "medium" | "large";

interface Room {
  id: number;
  name: string;
  type: string; // "Study Pod" | "Meeting Room" | "Creator Studio" | "Event Space"
  size: RoomSize;
  rate: number; // THB / hour
}

interface Beverage {
  id: string;
  name: string;
  price: number;
  personas: Persona[];
}

interface CustomerSeed {
  uid: string; // LINE UID — the cross-touchpoint primary key
  name: string;
  age: number;
  gender: "ชาย" | "หญิง";
  occupation: string;
  persona: Persona;
  recencyDays: number; // days since last visit (seed history anchors here)
  freq90: number; // bookings in the last 90 days
  baseHour: number; // preferred start hour
  attachProb: number; // chance a visit includes beverage orders
}

interface Booking {
  id: string;
  customerId: string;
  roomId: number;
  dayOffset: number; // 0 = today, larger = further in the past
  hour: number;
  duration: number; // hours
  amount: number; // room fee actually paid (after any discounts)
  isNew?: boolean; // created via the simulator this session
  usedCoupon?: boolean;
}

interface OrderLine {
  bevId: string;
  qty: number;
}

interface Billing {
  bookingId: string;
  lines: OrderLine[];
  amount: number;
}

interface BundleRule {
  id: string;
  roomType: string;
  hourFrom: number;
  hourTo: number;
  bevId: string;
  lift: number;
  confidence: number; // %
  pitch: string;
}

interface AppEvent {
  id: number;
  text: string;
  tone: "success" | "info" | "warn";
}

interface AppState {
  bookings: Booking[];
  billings: Billing[];
  dynamicPricing: boolean;
  activeBundles: string[]; // BundleRule ids
  couponOffers: string[]; // customer uids holding an unredeemed win-back coupon
  couponsSent: number;
  couponsConverted: number;
  csatSum: number;
  csatCount: number;
  events: AppEvent[];
  nextEventId: number;
}

/* ============================================================
   Static catalogs
   ============================================================ */

const ROOMS: Room[] = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Study Pod ${i + 1}`,
    type: "Study Pod",
    size: "small" as const,
    rate: 300,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: i + 11,
    name: `Meeting Room ${String.fromCharCode(65 + i)}`,
    type: "Meeting Room",
    size: "medium" as const,
    rate: 500,
  })),
  { id: 17, name: "Creator Studio 1", type: "Creator Studio", size: "large", rate: 1000 },
  { id: 18, name: "Creator Studio 2", type: "Creator Studio", size: "large", rate: 1000 },
  { id: 19, name: "Event Space 1", type: "Event Space", size: "large", rate: 1000 },
  { id: 20, name: "Event Space 2", type: "Event Space", size: "large", rate: 1000 },
];

const ROOM_BY_ID = new Map(ROOMS.map((r) => [r.id, r]));

const BEVERAGES: Beverage[] = [
  { id: "boba", name: "ชานมไข่มุก", price: 45, personas: ["student"] },
  { id: "matcha", name: "มัทฉะลาเต้เย็น", price: 60, personas: ["student"] },
  { id: "cocoa", name: "โกโก้เย็น", price: 50, personas: ["student"] },
  { id: "americano", name: "อเมริกาโน่เย็น", price: 65, personas: ["pro", "creator"] },
  { id: "latte", name: "คาเฟ่ลาเต้", price: 75, personas: ["pro"] },
  { id: "coffeeset", name: "ชุดกาแฟพรีเมียม (4 แก้ว)", price: 260, personas: ["pro"] },
  { id: "energy", name: "Energy Drink", price: 50, personas: ["creator"] },
  { id: "water", name: "น้ำเปล่า", price: 15, personas: ["student", "pro", "creator"] },
];

const BEV_BY_ID = new Map(BEVERAGES.map((b) => [b.id, b]));

/** dim_customers — 15 profiles keyed by LINE UID (single customer view). */
const CUSTOMERS: CustomerSeed[] = [
  { uid: "U1f2a8c31", name: "น้องมายด์", age: 20, gender: "หญิง", occupation: "นักศึกษา", persona: "student", recencyDays: 2, freq90: 14, baseHour: 17, attachProb: 0.3 },
  { uid: "U2b9d1e42", name: "ปอนด์", age: 21, gender: "ชาย", occupation: "นักศึกษา", persona: "student", recencyDays: 5, freq90: 11, baseHour: 18, attachProb: 0.24 },
  { uid: "U3c4f7a53", name: "เฟิร์น", age: 19, gender: "หญิง", occupation: "นักศึกษา", persona: "student", recencyDays: 1, freq90: 16, baseHour: 17, attachProb: 0.32 },
  { uid: "U4d8e2b64", name: "เจมส์", age: 22, gender: "ชาย", occupation: "นักศึกษา", persona: "student", recencyDays: 9, freq90: 8, baseHour: 19, attachProb: 0.2 },
  { uid: "U5e1c9f75", name: "แพรวา", age: 20, gender: "หญิง", occupation: "นักศึกษา", persona: "student", recencyDays: 12, freq90: 7, baseHour: 16, attachProb: 0.26 },
  { uid: "U6f5a3d86", name: "ต้นกล้า", age: 21, gender: "ชาย", occupation: "นักศึกษา", persona: "student", recencyDays: 3, freq90: 12, baseHour: 18, attachProb: 0.28 },
  { uid: "U7a6b4e97", name: "มีนา", age: 22, gender: "หญิง", occupation: "นักศึกษา", persona: "student", recencyDays: 27, freq90: 9, baseHour: 17, attachProb: 0.3 },
  { uid: "U8b7c5fa8", name: "บอส", age: 23, gender: "ชาย", occupation: "นักศึกษา", persona: "student", recencyDays: 18, freq90: 5, baseHour: 20, attachProb: 0.22 },
  { uid: "U9c8d6ab9", name: "คุณกานต์", age: 29, gender: "หญิง", occupation: "ฟรีแลนซ์", persona: "pro", recencyDays: 4, freq90: 10, baseHour: 10, attachProb: 0.4 },
  { uid: "Uad9e7bc0", name: "คุณวิน", age: 34, gender: "ชาย", occupation: "พนักงานบริษัท", persona: "pro", recencyDays: 6, freq90: 9, baseHour: 13, attachProb: 0.42 },
  { uid: "Ube0f8cd1", name: "คุณพลอย", age: 31, gender: "หญิง", occupation: "พนักงานบริษัท", persona: "pro", recencyDays: 28, freq90: 12, baseHour: 10, attachProb: 0.38 },
  { uid: "Ucf1a9de2", name: "คุณนัท", age: 27, gender: "ชาย", occupation: "ฟรีแลนซ์", persona: "pro", recencyDays: 33, freq90: 10, baseHour: 11, attachProb: 0.36 },
  { uid: "Ud02babf3", name: "คุณเมษ์", age: 26, gender: "หญิง", occupation: "ครีเอเตอร์", persona: "creator", recencyDays: 7, freq90: 8, baseHour: 18, attachProb: 0.34 },
  { uid: "Ue13cbc04", name: "คุณภูมิ", age: 30, gender: "ชาย", occupation: "ครีเอเตอร์", persona: "creator", recencyDays: 26, freq90: 11, baseHour: 19, attachProb: 0.3 },
  { uid: "Uf24dcd15", name: "คุณอิง", age: 38, gender: "หญิง", occupation: "พนักงานบริษัท", persona: "pro", recencyDays: 10, freq90: 6, baseHour: 14, attachProb: 0.44 },
];

const CUSTOMER_BY_UID = new Map(CUSTOMERS.map((c) => [c.uid, c]));

/** Simulated Apriori output — association rules feeding Smart Bundling. */
const BUNDLE_RULES: BundleRule[] = [
  {
    id: "rule-meeting-coffee",
    roomType: "Meeting Room",
    hourFrom: 9,
    hourTo: 15,
    bevId: "coffeeset",
    lift: 3.1,
    confidence: 68,
    pitch: "จอง Meeting Room ช่วงกลางวัน → มักสั่งชุดกาแฟพรีเมียมตามมา",
  },
  {
    id: "rule-studio-energy",
    roomType: "Creator Studio",
    hourFrom: 16,
    hourTo: 22,
    bevId: "energy",
    lift: 2.7,
    confidence: 61,
    pitch: "จอง Creator Studio ช่วงเย็น → มักสั่ง Energy Drink ระหว่างถ่ายงาน",
  },
  {
    id: "rule-pod-boba",
    roomType: "Study Pod",
    hourFrom: 16,
    hourTo: 21,
    bevId: "boba",
    lift: 2.2,
    confidence: 57,
    pitch: "จอง Study Pod ช่วงเย็น (กลุ่มติวหนังสือ) → มักสั่งชานมไข่มุกเป็นคู่",
  },
];

const BUNDLE_DISCOUNT = 0.15; // 15% off the beverage when taken as a bundle
const OFF_PEAK_DISCOUNT = 0.18; // dynamic pricing: -18% on off-peak hours
const COUPON_DISCOUNT = 0.15; // win-back coupon: -15% on the room fee

/* ============================================================
   Demand curves (simulated time-series forecast output)
   ============================================================ */

// Hourly demand 0..1 per room family — Prophet-style seasonal profile.
const CURVE_STUDENT = [0.04, 0.02, 0.02, 0.02, 0.02, 0.03, 0.06, 0.1, 0.16, 0.24, 0.3, 0.34, 0.38, 0.42, 0.5, 0.6, 0.74, 0.88, 0.92, 0.86, 0.66, 0.4, 0.18, 0.08];
const CURVE_PRO = [0.03, 0.02, 0.02, 0.02, 0.02, 0.04, 0.1, 0.22, 0.44, 0.66, 0.82, 0.86, 0.72, 0.84, 0.8, 0.68, 0.52, 0.38, 0.26, 0.18, 0.12, 0.08, 0.05, 0.03];
const CURVE_CREATOR = [0.06, 0.04, 0.03, 0.02, 0.02, 0.03, 0.05, 0.08, 0.14, 0.22, 0.3, 0.36, 0.4, 0.46, 0.52, 0.62, 0.74, 0.84, 0.9, 0.88, 0.78, 0.56, 0.3, 0.14];

function baseHeatFor(room: Room, hour: number): number {
  const curve = room.size === "small" ? CURVE_STUDENT : room.size === "medium" ? CURVE_PRO : CURVE_CREATOR;
  // Deterministic per-cell jitter so rows don't look copy-pasted.
  const jitter = (((room.id * 31 + hour * 17) % 13) / 13 - 0.5) * 0.14;
  return Math.min(1, Math.max(0, curve[hour] + jitter));
}

/** Hours the forecast marks as off-peak → dynamic pricing targets. */
const OFF_PEAK_HOURS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 21, 22, 23]);

function priceFor(room: Room, hour: number, dynamicPricing: boolean): number {
  if (dynamicPricing && OFF_PEAK_HOURS.has(hour)) {
    return Math.round(room.rate * (1 - OFF_PEAK_DISCOUNT));
  }
  return room.rate;
}

/* ============================================================
   Seeded mock history (fact_bookings + fact_billings)
   ============================================================ */

function mulberry32(seed: number) {
  let t0 = seed;
  return function () {
    let t = (t0 += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateHistory(): { bookings: Booking[]; billings: Billing[] } {
  const rng = mulberry32(20260715);
  const bookings: Booking[] = [];
  const billings: Billing[] = [];
  let seq = 1;

  for (const c of CUSTOMERS) {
    const span = 88 - c.recencyDays;
    for (let k = 0; k < c.freq90; k++) {
      const dayOffset = c.recencyDays + Math.round((k * span) / c.freq90 + rng() * 4);
      const hour = Math.min(21, Math.max(8, c.baseHour + Math.floor(rng() * 3) - 1));
      const duration = c.persona === "pro" ? 2 + Math.floor(rng() * 3) : 2 + Math.floor(rng() * 2);

      let roomId: number;
      if (c.persona === "student") {
        roomId = 1 + Math.floor(rng() * 10);
      } else if (c.persona === "creator") {
        roomId = rng() < 0.75 ? 17 + Math.floor(rng() * 2) : 11 + Math.floor(rng() * 6);
      } else {
        roomId = rng() < 0.85 ? 11 + Math.floor(rng() * 6) : 19 + Math.floor(rng() * 2);
      }
      const room = ROOM_BY_ID.get(roomId)!;
      const id = `B${String(seq++).padStart(3, "0")}`;
      bookings.push({ id, customerId: c.uid, roomId, dayOffset, hour, duration, amount: room.rate * duration });

      if (rng() < c.attachProb) {
        const pool = BEVERAGES.filter((b) => b.personas.includes(c.persona));
        const lineCount = 1 + Math.floor(rng() * 2);
        const lines: OrderLine[] = [];
        for (let l = 0; l < lineCount; l++) {
          const bev = pool[Math.floor(rng() * pool.length)];
          const qty = bev.id === "coffeeset" ? 1 : 1 + Math.floor(rng() * 2);
          const existing = lines.find((x) => x.bevId === bev.id);
          if (existing) existing.qty += qty;
          else lines.push({ bevId: bev.id, qty });
        }
        const amount = lines.reduce((s, l) => s + BEV_BY_ID.get(l.bevId)!.price * l.qty, 0);
        billings.push({ bookingId: id, lines, amount });
      }
    }
  }
  return { bookings, billings };
}

const HISTORY = generateHistory();

/* ============================================================
   Metrics engine (recomputed from state on every dispatch)
   ============================================================ */

interface ChurnRow {
  uid: string;
  name: string;
  occupation: string;
  persona: Persona;
  monetary: number;
  recency: number;
  risk: number;
  couponSent: boolean;
}

function computeMetrics(state: AppState) {
  const { bookings, billings } = state;
  const billingByBooking = new Map(billings.map((b) => [b.bookingId, b]));

  const b30 = bookings.filter((b) => b.dayOffset <= 30);
  const roomRev30 = b30.reduce((s, b) => s + b.amount, 0);
  const bevRev30 = b30.reduce((s, b) => s + (billingByBooking.get(b.id)?.amount ?? 0), 0);
  const attach30 = b30.length === 0 ? 0 : (b30.filter((b) => billingByBooking.has(b.id)).length / b30.length) * 100;
  const aov30 = b30.length === 0 ? 0 : (roomRev30 + bevRev30) / b30.length;

  // Per-customer rollup (single customer view via LINE UID).
  const perCustomer = new Map<string, { recency: number; monetary: number; count30: number }>();
  for (const c of CUSTOMERS) perCustomer.set(c.uid, { recency: 999, monetary: 0, count30: 0 });
  for (const b of bookings) {
    const row = perCustomer.get(b.customerId);
    if (!row) continue;
    row.recency = Math.min(row.recency, b.dayOffset);
    row.monetary += b.amount + (billingByBooking.get(b.id)?.amount ?? 0);
    if (b.dayOffset <= 30) row.count30 += 1;
  }

  const active = [...perCustomer.values()].filter((r) => r.count30 > 0);
  const repeatRate = active.length === 0 ? 0 : (active.filter((r) => r.count30 >= 2).length / active.length) * 100;

  const churnRows: ChurnRow[] = CUSTOMERS.map((c) => {
    const row = perCustomer.get(c.uid)!;
    const risk = Math.min(97, Math.max(4, Math.round(row.recency * 3 + (c.persona !== "student" ? 6 : 0))));
    return {
      uid: c.uid,
      name: c.name,
      occupation: c.occupation,
      persona: c.persona,
      monetary: row.monetary,
      recency: row.recency,
      risk,
      couponSent: state.couponOffers.includes(c.uid),
    };
  })
    .filter((r) => r.risk >= 80)
    .sort((a, b) => b.risk - a.risk);

  // Occupancy: mean forecast heat across business hours + today's real bookings.
  let heatSum = 0;
  let heatCells = 0;
  for (const room of ROOMS) {
    for (let h = 9; h <= 21; h++) {
      heatSum += baseHeatFor(room, h);
      heatCells++;
    }
  }
  const newCells = bookings.filter((b) => b.isNew).reduce((s, b) => s + b.duration, 0);
  const occupancy = Math.min(100, (heatSum / heatCells) * 100 + (newCells / heatCells) * 100);

  // Top services (share of 30-day bookings per room type).
  const typeCount = new Map<string, number>();
  for (const b of b30) {
    const t = ROOM_BY_ID.get(b.roomId)!.type;
    typeCount.set(t, (typeCount.get(t) ?? 0) + 1);
  }
  const pieData = [...typeCount.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Top beverages by 30-day quantity.
  const bevQty = new Map<string, number>();
  for (const b of b30) {
    const bill = billingByBooking.get(b.id);
    if (!bill) continue;
    for (const line of bill.lines) bevQty.set(line.bevId, (bevQty.get(line.bevId) ?? 0) + line.qty);
  }
  const barData = [...bevQty.entries()]
    .map(([bevId, qty]) => ({ name: BEV_BY_ID.get(bevId)!.name, qty, bevId }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  const lineConversion = state.couponsSent === 0 ? 0 : (state.couponsConverted / state.couponsSent) * 100;
  const csat = state.csatCount === 0 ? 0 : state.csatSum / state.csatCount;

  return {
    roomRev30,
    bevRev30,
    attach30,
    aov30,
    totalCustomers: CUSTOMERS.length,
    activeCount: active.length,
    repeatRate,
    occupancy,
    pieData,
    barData,
    churnRows,
    lineConversion,
    csat,
    topService: pieData[0]?.name ?? "—",
    topServiceShare: pieData.length === 0 ? 0 : (pieData[0].value / b30.length) * 100,
  };
}

type Metrics = ReturnType<typeof computeMetrics>;

/** Pre-CDP baselines — fixed at first render so goal bars tell a story. */
const INITIAL_STATE_FOR_BASELINE: AppState = {
  bookings: HISTORY.bookings,
  billings: HISTORY.billings,
  dynamicPricing: false,
  activeBundles: [],
  couponOffers: [],
  couponsSent: 47,
  couponsConverted: 16,
  csatSum: 578,
  csatCount: 126,
  events: [],
  nextEventId: 1,
};

const M0 = computeMetrics(INITIAL_STATE_FOR_BASELINE);
const BASELINES = {
  revenue: Math.round(M0.roomRev30 / 1.062), // history already shows +6.2% since CDP launch
  attach: 22, // pre-CDP beverage attach rate (%)
  aov: Math.round(M0.aov30 / 1.052),
};

function goalProgress(current: number, baseline: number, target: number): number {
  if (target === baseline) return 0;
  return Math.min(100, Math.max(0, ((current - baseline) / (target - baseline)) * 100));
}

/* ============================================================
   Reducer
   ============================================================ */

type Action =
  | { type: "toggleDynamicPricing" }
  | { type: "sendCoupon"; uid: string }
  | { type: "toggleBundle"; ruleId: string }
  | { type: "simBook"; booking: Booking; customerName: string }
  | { type: "simCheckout"; bookingId: string; lines: OrderLine[]; rating: number; customerName: string };

function pushEvent(state: AppState, text: string, tone: AppEvent["tone"]): Pick<AppState, "events" | "nextEventId"> {
  return {
    events: [{ id: state.nextEventId, text, tone }, ...state.events].slice(0, 8),
    nextEventId: state.nextEventId + 1,
  };
}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "toggleDynamicPricing": {
      const on = !state.dynamicPricing;
      return {
        ...state,
        dynamicPricing: on,
        ...pushEvent(
          state,
          on
            ? "เปิด Dynamic Pricing — ห้องช่วง Off-Peak ลดราคา 18% บนหน้าเว็บจองอัตโนมัติ"
            : "ปิด Dynamic Pricing — ทุกช่วงเวลากลับสู่ราคาปกติ",
          on ? "success" : "info",
        ),
      };
    }
    case "sendCoupon": {
      if (state.couponOffers.includes(action.uid)) return state;
      const name = CUSTOMER_BY_UID.get(action.uid)?.name ?? action.uid;
      return {
        ...state,
        couponOffers: [...state.couponOffers, action.uid],
        couponsSent: state.couponsSent + 1,
        ...pushEvent(state, `ยิงคูปองส่วนลด 15% เข้า LINE OA ของ ${name} แล้ว`, "success"),
      };
    }
    case "toggleBundle": {
      const active = state.activeBundles.includes(action.ruleId);
      const rule = BUNDLE_RULES.find((r) => r.id === action.ruleId)!;
      const bevName = BEV_BY_ID.get(rule.bevId)!.name;
      return {
        ...state,
        activeBundles: active
          ? state.activeBundles.filter((id) => id !== action.ruleId)
          : [...state.activeBundles, action.ruleId],
        ...pushEvent(
          state,
          active
            ? `ปิดดีลพ่วง ${rule.roomType} + ${bevName} บนหน้าเว็บจองแล้ว`
            : `เปิดดีลพ่วง ${rule.roomType} + ${bevName} (-15%) บนหน้าเว็บจองแล้ว`,
          active ? "info" : "success",
        ),
      };
    }
    case "simBook": {
      const converted = action.booking.usedCoupon;
      return {
        ...state,
        bookings: [action.booking, ...state.bookings],
        couponOffers: converted
          ? state.couponOffers.filter((uid) => uid !== action.booking.customerId)
          : state.couponOffers,
        couponsConverted: converted ? state.couponsConverted + 1 : state.couponsConverted,
        ...pushEvent(
          state,
          converted
            ? `${action.customerName} ใช้คูปอง Win-Back จองห้องสำเร็จ — LINE OA Conversion +1`
            : `${action.customerName} จองห้องผ่านเว็บ (ชำระรอบที่ 1) — ยอดจองใหม่เข้าระบบ`,
          "success",
        ),
      };
    }
    case "simCheckout": {
      const amount = action.lines.reduce((s, l) => s + BEV_BY_ID.get(l.bevId)!.price * l.qty, 0);
      return {
        ...state,
        billings:
          action.lines.length > 0
            ? [...state.billings, { bookingId: action.bookingId, lines: action.lines, amount }]
            : state.billings,
        csatSum: state.csatSum + action.rating,
        csatCount: state.csatCount + 1,
        ...pushEvent(
          state,
          `${action.customerName} เช็กเอาต์ — บิลรวม 2 รอบถูกผูกเข้า LINE UID เดียวกัน, CSAT ${action.rating}/5`,
          "info",
        ),
      };
    }
  }
}

/* ============================================================
   Formatting + small UI atoms
   ============================================================ */

const fmtInt = (n: number) => Math.round(n).toLocaleString("th-TH");
const fmtBaht = (n: number) => `฿${fmtInt(n)}`;
const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

const PERSONA_META: Record<Persona, { label: string; chip: string; dot: string }> = {
  student: { label: "นักศึกษา", chip: "bg-sky-50 text-sky-700 border-sky-200", dot: "#0ea5e9" },
  pro: { label: "คนทำงาน/ฟรีแลนซ์", chip: "bg-violet-50 text-violet-700 border-violet-200", dot: "#8b5cf6" },
  creator: { label: "ครีเอเตอร์", chip: "bg-amber-50 text-amber-700 border-amber-200", dot: "#f59e0b" },
};

function PersonaChip({ persona }: { persona: Persona }) {
  const meta = PERSONA_META[persona];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.chip}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
      {meta.label}
    </span>
  );
}

/** Animated number that writes to textContent (no re-render churn). */
function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.textContent = format(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, format, reduced]);

  return <span ref={ref}>{format(value)}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  // min-w-0 lets Cards shrink inside grid tracks so wide content (heatmap,
  // tables) scrolls in its own overflow-x-auto container instead of
  // stretching the page on mobile.
  return (
    <div className={`min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-900" style={{ fontFamily: "var(--font-bricolage), var(--font-anuphan), sans-serif" }}>
          {title}
        </h2>
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}

/* ============================================================
   Dashboard — goal bars
   ============================================================ */

function GoalBars({ m }: { m: Metrics }) {
  const goals = [
    {
      id: "g1",
      icon: <Banknote className="h-4 w-4" />,
      title: "เป้า 1 · ยอดจองห้อง +15% ใน 6 เดือน",
      currentLabel: `${fmtBaht(m.roomRev30)} /30 วัน`,
      targetLabel: `เป้า ${fmtBaht(Math.round(BASELINES.revenue * 1.15))}`,
      progress: goalProgress(m.roomRev30, BASELINES.revenue, BASELINES.revenue * 1.15),
      bar: "bg-blue-600",
    },
    {
      id: "g2",
      icon: <CupSoda className="h-4 w-4" />,
      title: "เป้า 2 · Beverage Attach Rate → 40%",
      currentLabel: `ปัจจุบัน ${fmtPct(m.attach30)}`,
      targetLabel: "เป้า 40%",
      progress: goalProgress(m.attach30, BASELINES.attach, 40),
      bar: "bg-emerald-600",
    },
    {
      id: "g3",
      icon: <TrendingUp className="h-4 w-4" />,
      title: "เป้า 3 · AOV รวม (ค่าห้อง+ค่าน้ำ) +15%",
      currentLabel: `${fmtBaht(m.aov30)} /บิล`,
      targetLabel: `เป้า ${fmtBaht(Math.round(BASELINES.aov * 1.15))}`,
      progress: goalProgress(m.aov30, BASELINES.aov, BASELINES.aov * 1.15),
      bar: "bg-violet-600",
    },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {goals.map((g) => (
        <Card key={g.id} className="p-4">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600">{g.icon}</span>
            <p className="text-xs font-semibold">{g.title}</p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className={`h-full rounded-full ${g.bar}`}
              initial={false}
              animate={{ width: `${g.progress}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-700">{g.currentLabel}</span>
            <span className="text-slate-400">{g.targetLabel}</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            ความคืบหน้า <span className="font-bold text-slate-800">{fmtPct(g.progress, 0)}</span> ของเป้าหมาย
          </p>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================
   Dashboard — 8 core KPI cards
   ============================================================ */

function KpiGrid({ m }: { m: Metrics }) {
  const kpis: Array<{
    id: string;
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    sub: string;
  }> = [
    {
      id: "customers",
      icon: <Users className="h-4 w-4" />,
      label: "Total Customers",
      value: <CountUp value={m.totalCustomers} format={fmtInt} />,
      sub: "สมาชิก CDP ทั้งหมด (LINE UID)",
    },
    {
      id: "newreg",
      icon: <UserRound className="h-4 w-4" />,
      label: "New Registration Rate",
      value: <span>+9.4%</span>,
      sub: "สมัครใหม่ผ่าน LINE/เว็บ เดือนนี้ +14 คน",
    },
    {
      id: "active",
      icon: <Activity className="h-4 w-4" />,
      label: "Active & Repeat Rate",
      value: <CountUp value={m.repeatRate} format={(n) => fmtPct(n, 0)} />,
      sub: `ลูกค้า Active 30 วัน ${m.activeCount} คน กลับมาซ้ำ`,
    },
    {
      id: "occupancy",
      icon: <ThermometerSun className="h-4 w-4" />,
      label: "Space Occupancy Rate",
      value: <CountUp value={m.occupancy} format={(n) => fmtPct(n, 0)} />,
      sub: "ความหนาแน่นเฉลี่ยช่วงเวลาทำการ (20 ห้อง)",
    },
    {
      id: "aov",
      icon: <Banknote className="h-4 w-4" />,
      label: "Combined AOV",
      value: <CountUp value={m.aov30} format={fmtBaht} />,
      sub: "ค่าห้องรอบ 1 + บิลค่าน้ำรอบ 2 ต่อการจอง",
    },
    {
      id: "topservice",
      icon: <Star className="h-4 w-4" />,
      label: "Top Favorite Services",
      value: <span className="text-lg">{m.topService}</span>,
      sub: `ครองสัดส่วน ${fmtPct(m.topServiceShare, 0)} ของการจอง 30 วัน`,
    },
    {
      id: "lineconv",
      icon: <MessageCircleHeart className="h-4 w-4" />,
      label: "LINE OA Conversion Rate",
      value: <CountUp value={m.lineConversion} format={(n) => fmtPct(n, 0)} />,
      sub: "ส่งคูปองแล้วลูกค้ากลับมาจองซ้ำ",
    },
    {
      id: "csat",
      icon: <Sparkles className="h-4 w-4" />,
      label: "CSAT",
      value: <CountUp value={m.csat} format={(n) => n.toFixed(2)} />,
      sub: "คะแนนความพึงพอใจเฉลี่ยหลังเช็กเอาต์ (เต็ม 5)",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((k) => (
        <Card key={k.id} className="p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">{k.icon}</span>
            <p className="text-[11px] font-semibold uppercase tracking-wide">{k.label}</p>
          </div>
          <p
            className="mt-2 text-2xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-bricolage), var(--font-anuphan), sans-serif" }}
          >
            {k.value}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-slate-500">{k.sub}</p>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================
   Dashboard — occupancy heatmap + dynamic pricing toggle
   ============================================================ */

function heatColor(t: number): string {
  // green (vacant) → amber (filling) → red (peak)
  const stops: Array<[number, [number, number, number]]> = [
    [0, [220, 252, 231]], // green-100
    [0.45, [253, 230, 138]], // amber-200
    [0.75, [251, 146, 60]], // orange-400
    [1, [239, 68, 68]], // red-500
  ];
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const span = hi[0] - lo[0] || 1;
  const f = (t - lo[0]) / span;
  const rgb = lo[1].map((c, i) => Math.round(c + (hi[1][i] - c) * f));
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

function OccupancyHeatmap({
  state,
  dispatch,
}: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}) {
  // Cells booked today via the simulator get a distinct blue overlay.
  const newCells = useMemo(() => {
    const set = new Set<string>();
    for (const b of state.bookings) {
      if (!b.isNew) continue;
      for (let h = b.hour; h < Math.min(24, b.hour + b.duration); h++) set.add(`${b.roomId}:${h}`);
    }
    return set;
  }, [state.bookings]);

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          icon={<ThermometerSun className="h-4 w-4" />}
          title="Occupancy Heatmap — 20 ห้อง × 24 ชั่วโมง"
          subtitle="ผลพยากรณ์ความหนาแน่นจากโมเดล Time-Series Forecasting (เขียว = ว่าง, แดง = แน่น)"
        />
        <button
          type="button"
          onClick={() => dispatch({ type: "toggleDynamicPricing" })}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            state.dynamicPricing
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
          aria-pressed={state.dynamicPricing}
        >
          <span
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
              state.dynamicPricing ? "bg-emerald-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute h-3 w-3 rounded-full bg-white shadow transition-transform ${
                state.dynamicPricing ? "translate-x-3.5" : "translate-x-0.5"
              }`}
            />
          </span>
          <Zap className="h-3.5 w-3.5" />
          Dynamic Pricing {state.dynamicPricing ? "ON" : "OFF"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {state.dynamicPricing ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                ระบบราคาอัตโนมัติทำงานอยู่ — ห้องในช่วง <b>Off-Peak (21:00–09:00)</b> ถูกปรับลดราคา{" "}
                <b>18%</b> บนหน้าเว็บจองหลักแล้ว (เช่น Study Pod ฿300 → ฿{fmtInt(300 * (1 - OFF_PEAK_DISCOUNT))}/ชม.)
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-3 overflow-x-auto pb-1">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[88px_repeat(24,1fr)] gap-[3px] text-[9px] text-slate-400">
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-center tabular-nums">
                {h % 3 === 0 ? `${String(h).padStart(2, "0")}` : ""}
              </div>
            ))}
          </div>
          {ROOMS.map((room) => (
            <div key={room.id} className="mt-[3px] grid grid-cols-[88px_repeat(24,1fr)] gap-[3px]">
              <div className="flex items-center truncate pr-1 text-[10px] font-medium text-slate-600">
                {room.name}
              </div>
              {Array.from({ length: 24 }, (_, h) => {
                const isNew = newCells.has(`${room.id}:${h}`);
                const discounted = state.dynamicPricing && OFF_PEAK_HOURS.has(h);
                return (
                  <div
                    key={h}
                    title={`${room.name} · ${String(h).padStart(2, "0")}:00 · ${
                      isNew ? "จองใหม่ (Simulator)" : `ความหนาแน่น ${Math.round(baseHeatFor(room, h) * 100)}%`
                    }${discounted ? ` · Off-Peak -18% → ${fmtBaht(priceFor(room, h, true))}/ชม.` : ""}`}
                    className={`h-3.5 rounded-[3px] ${isNew ? "ring-2 ring-blue-600 ring-offset-[0.5px]" : ""} ${
                      discounted && !isNew ? "outline outline-1 -outline-offset-1 outline-emerald-500/60" : ""
                    }`}
                    style={{ backgroundColor: isNew ? "#2563eb" : heatColor(baseHeatFor(room, h)) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: heatColor(0.1) }} /> ว่าง / Off-Peak
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: heatColor(0.55) }} /> เริ่มแน่น
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: heatColor(0.95) }} /> Peak / แน่นมาก
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-blue-600" /> จองใหม่จาก Simulator
        </span>
        {state.dynamicPricing ? (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] outline outline-1 -outline-offset-1 outline-emerald-500" />{" "}
            ช่วงที่ลดราคาอยู่
          </span>
        ) : null}
      </div>
    </Card>
  );
}

/* ============================================================
   Dashboard — service & beverage charts
   ============================================================ */

const PIE_COLORS: Record<string, string> = {
  "Study Pod": "#0ea5e9",
  "Meeting Room": "#8b5cf6",
  "Creator Studio": "#f59e0b",
  "Event Space": "#10b981",
};

function ServiceCharts({ m }: { m: Metrics }) {
  const totalPie = m.pieData.reduce((s, d) => s + d.value, 0);
  return (
    <Card className="flex h-full flex-col p-4">
      <SectionHeader
        icon={<Star className="h-4 w-4" />}
        title="Top Favorite Services & Beverages"
        subtitle="สัดส่วนประเภทห้องยอดฮิต + เครื่องดื่มขายดี 30 วัน (แยกตาม Persona)"
      />
      <div className="mt-2 grid flex-1 gap-2 sm:grid-cols-2">
        <div className="flex flex-col">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={m.pieData} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={3} strokeWidth={0}>
                  {m.pieData.map((d) => (
                    <Cell key={d.name} fill={PIE_COLORS[d.name] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value)} ครั้ง (${totalPie ? Math.round((Number(value) / totalPie) * 100) : 0}%)`,
                    String(name),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1 text-[11px] text-slate-600">
            {m.pieData.map((d) => (
              <li key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[d.name] ?? "#94a3b8" }} />
                  {d.name}
                </span>
                <span className="font-semibold text-slate-800">
                  {totalPie ? Math.round((d.value / totalPie) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col">
          <p className="mb-1 text-[11px] font-semibold text-slate-500">เครื่องดื่มขายดี (แก้ว/30 วัน)</p>
          <div className="min-h-44 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.barData} layout="vertical" margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={104}
                  tick={{ fontSize: 10, fill: "#334155" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(value) => [`${Number(value)} แก้ว`, "ยอดสั่ง"]} />
                <Bar dataKey="qty" radius={[0, 4, 4, 0]}>
                  {m.barData.map((d) => {
                    const bev = BEV_BY_ID.get(d.bevId)!;
                    const fill = bev.personas.includes("student")
                      ? "#0ea5e9"
                      : bev.personas.includes("creator") && !bev.personas.includes("pro")
                        ? "#f59e0b"
                        : "#8b5cf6";
                    return <Cell key={d.bevId} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            สี = Persona หลักที่สั่ง: ฟ้า นักศึกษา · ม่วง คนทำงาน · ส้ม ครีเอเตอร์
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ============================================================
   Dashboard — VIP churn risk table
   ============================================================ */

function ChurnTable({ m, dispatch }: { m: Metrics; dispatch: React.Dispatch<Action> }) {
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
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-2 font-semibold">ลูกค้า</th>
                <th className="pb-2 pr-2 font-semibold">ยอดสะสม</th>
                <th className="pb-2 pr-2 font-semibold">ล่าสุด</th>
                <th className="pb-2 pr-2 font-semibold">Churn Risk</th>
                <th className="pb-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {m.churnRows.map((row) => (
                <tr key={row.uid} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-2">
                    <p className="font-semibold text-slate-800">{row.name}</p>
                    <PersonaChip persona={row.persona} />
                  </td>
                  <td className="py-2.5 pr-2 font-semibold tabular-nums text-slate-700">{fmtBaht(row.monetary)}</td>
                  <td className="py-2.5 pr-2 text-slate-500">{row.recency} วันก่อน</td>
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
                        className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
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
      <p className="mt-3 text-[10px] text-slate-400">
        เคล็ดลับ: ส่งคูปองแล้วไปที่แท็บ「จำลองการจองของลูกค้า」เลือกลูกค้าคนเดิมเพื่อดูคูปองถูกใช้จริง —
        LINE OA Conversion จะขยับทันที
      </p>
    </Card>
  );
}

/* ============================================================
   Dashboard — AI smart bundling suggestions
   ============================================================ */

function BundlePanel({ state, dispatch }: { state: AppState; dispatch: React.Dispatch<Action> }) {
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
          return (
            <div
              key={rule.id}
              className={`rounded-lg border p-3 transition-colors ${
                active ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200 bg-slate-50/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {rule.roomType} ({String(rule.hourFrom).padStart(2, "0")}:00–{String(rule.hourTo).padStart(2, "0")}:00) + {bev.name}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{rule.pitch}</p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-400">
                    Lift <span className="text-amber-600">{rule.lift.toFixed(1)}</span> · Confidence{" "}
                    <span className="text-amber-600">{rule.confidence}%</span> · ส่วนลดพ่วง -15%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: "toggleBundle", ruleId: rule.id });
                    if (!active) {
                      toast.success(`เปิดดีล ${rule.roomType} + ${bev.name} บนหน้าเว็บจองแล้ว — ลูกค้าจะเห็น Pop-up พ่วงตอนยืนยันจอง`);
                    } else {
                      toast(`ปิดดีล ${rule.roomType} + ${bev.name} แล้ว`);
                    }
                  }}
                  className={`shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold shadow-sm transition-colors ${
                    active
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {active ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Active บนเว็บ
                    </span>
                  ) : (
                    "เปิดใช้ดีลบนเว็บ"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-[11px] text-blue-800">
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

function EventLog({ events }: { events: AppEvent[] }) {
  if (events.length === 0) return null;
  const toneClass: Record<AppEvent["tone"], string> = {
    success: "bg-emerald-500",
    info: "bg-blue-500",
    warn: "bg-amber-500",
  };
  return (
    <Card className="p-4">
      <SectionHeader icon={<Activity className="h-4 w-4" />} title="Activity Log" subtitle="เหตุการณ์ล่าสุดในเซสชันนี้" />
      <ul className="mt-3 space-y-1.5">
        <AnimatePresence initial={false}>
          {events.map((e) => (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 text-xs text-slate-600"
            >
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${toneClass[e.tone]}`} />
              <span>{e.text}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Card>
  );
}

/* ============================================================
   Customer Booking Simulator
   ============================================================ */

type SimStep = "customer" | "room" | "inroom" | "checkout" | "done";

interface SimBooking {
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

function Simulator({
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

export default function MarketingUser({ fontClass }: { fontClass: string }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE_FOR_BASELINE);
  const [tab, setTab] = useState<"dash" | "sim">("dash");
  const m = useMemo(() => computeMetrics(state), [state]);

  return (
    <div
      className={`${fontClass} min-h-screen bg-slate-50 text-slate-900`}
      style={{ fontFamily: "var(--font-inter), var(--font-anuphan), sans-serif" }}
    >
      <Toaster richColors position="top-center" />

      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <div>
              <p
                className="text-sm font-bold leading-tight"
                style={{ fontFamily: "var(--font-bricolage), var(--font-anuphan), sans-serif" }}
              >
                Marketing User
              </p>
              <p className="text-[10px] leading-tight text-slate-400">
                Smart Space CDP · 20 ห้อง · เชื่อมทุกธุรกรรมด้วย LINE UID
              </p>
            </div>
          </div>
          <nav className="flex rounded-full border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTab("dash")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                tab === "dash" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              แดชบอร์ดนักการตลาด
            </button>
            <button
              type="button"
              onClick={() => setTab("sim")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                tab === "sim" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <MonitorSmartphone className="h-3.5 w-3.5" />
              จำลองการจองของลูกค้า
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-5">
        <AnimatePresence mode="wait" initial={false}>
          {tab === "dash" ? (
            <motion.div
              key="dash"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Goal progress */}
              <GoalBars m={m} />
              {/* 8 core KPIs */}
              <KpiGrid m={m} />
              {/* Middle row */}
              <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                <OccupancyHeatmap state={state} dispatch={dispatch} />
                <ServiceCharts m={m} />
              </div>
              {/* Bottom row — action-oriented campaigns */}
              <div className="grid gap-4 lg:grid-cols-2">
                <ChurnTable m={m} dispatch={dispatch} />
                <BundlePanel state={state} dispatch={dispatch} />
              </div>
              <EventLog events={state.events} />
            </motion.div>
          ) : (
            <motion.div
              key="sim"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Simulator state={state} dispatch={dispatch} onGoDashboard={() => setTab("dash")} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-[10px] text-slate-400">
          <p>
            Smart Space CDP Prototype — Ingestion 3 จุด (LINE Register · Web Booking · In-Room QR) → K-Means ·
            Apriori · Time-Series → LINE OA Automation + Web Activation
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Coffee className="h-3 w-3" /> Upsell รอบ 2
            </span>
            <span className="flex items-center gap-1">
              <GlassWater className="h-3 w-3" /> จ่ายตอนเช็กเอาต์
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
