/**
 * Domain model for the Marketing User CDP dashboard — types, static catalogs
 * (rooms / beverages / seeded customers / Apriori bundle rules), discount
 * constants and the demand curves + pricing helpers used by both the seeded
 * history generator and the occupancy heatmap.
 *
 * Pure data + pure functions: no React, no state, safe to import anywhere.
 */

/* ============================================================
   Types
   ============================================================ */

export type Persona = "student" | "pro" | "creator";
export type RoomSize = "small" | "medium" | "large";

export interface Room {
  id: number;
  name: string;
  type: string; // "Study Pod" | "Meeting Room" | "Creator Studio" | "Event Space"
  size: RoomSize;
  rate: number; // THB / hour
}

export interface Beverage {
  id: string;
  name: string;
  price: number;
  personas: Persona[];
}

export interface CustomerSeed {
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

export interface Booking {
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

export interface OrderLine {
  bevId: string;
  qty: number;
}

export interface Billing {
  bookingId: string;
  lines: OrderLine[];
  amount: number;
}

export interface BundleRule {
  id: string;
  roomType: string;
  hourFrom: number;
  hourTo: number;
  bevId: string;
  lift: number;
  confidence: number; // %
  pitch: string;
}

export interface AppEvent {
  id: number;
  text: string;
  tone: "success" | "info" | "warn";
}

/** What approving a proposal actually does once a human signs off. */
export type ProposalPayload =
  | { kind: "coupon"; uids: string[] }
  | { kind: "bundle"; ruleId: string }
  | { kind: "pricing" };

/**
 * V2's Human-in-the-loop requirement — every marketer action from Page 2–4
 * lands here as `pending` first. Approving is what actually fires it (see
 * `approveProposal` in reducer.ts); rejecting discards it. `baselineTotal` is
 * a revenue snapshot taken at approval time so the Impact Tracker can show a
 * live "measured so far" number next to the original estimate.
 */
export interface Proposal {
  id: string;
  title: string;
  type: "coupon" | "bundle" | "pricing" | "retention";
  detail: string;
  targetCount: number;
  discountPct: number;
  estRevenueLift: number; // ฿ over the pilot window
  status: "pending" | "approved" | "rejected";
  payload: ProposalPayload;
  approvedAtTotal?: number; // ฿ combined Total Sales(30d) snapshot at approval
}

export interface AppState {
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
  proposals: Proposal[];
  nextProposalId: number;
}

/* ============================================================
   Static catalogs
   ============================================================ */

export const ROOMS: Room[] = [
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

export const ROOM_BY_ID = new Map(ROOMS.map((r) => [r.id, r]));

export const BEVERAGES: Beverage[] = [
  { id: "boba", name: "ชานมไข่มุก", price: 45, personas: ["student"] },
  { id: "matcha", name: "มัทฉะลาเต้เย็น", price: 60, personas: ["student"] },
  { id: "cocoa", name: "โกโก้เย็น", price: 50, personas: ["student"] },
  { id: "americano", name: "อเมริกาโน่เย็น", price: 65, personas: ["pro", "creator"] },
  { id: "latte", name: "คาเฟ่ลาเต้", price: 75, personas: ["pro"] },
  { id: "coffeeset", name: "ชุดกาแฟพรีเมียม (4 แก้ว)", price: 260, personas: ["pro"] },
  { id: "energy", name: "Energy Drink", price: 50, personas: ["creator"] },
  { id: "water", name: "น้ำเปล่า", price: 15, personas: ["student", "pro", "creator"] },
];

export const BEV_BY_ID = new Map(BEVERAGES.map((b) => [b.id, b]));

/** dim_customers — 15 profiles keyed by LINE UID (single customer view). */
export const CUSTOMERS: CustomerSeed[] = [
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

export const CUSTOMER_BY_UID = new Map(CUSTOMERS.map((c) => [c.uid, c]));

/** Simulated Apriori output — association rules feeding Smart Bundling. */
export const BUNDLE_RULES: BundleRule[] = [
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

export const BUNDLE_DISCOUNT = 0.15; // 15% off the beverage when taken as a bundle
export const OFF_PEAK_DISCOUNT = 0.18; // dynamic pricing: -18% on off-peak hours
export const COUPON_DISCOUNT = 0.15; // win-back coupon: -15% on the room fee

/* ============================================================
   Demand curves (simulated time-series forecast output)
   ============================================================ */

// Hourly demand 0..1 per room family — Prophet-style seasonal profile.
export const CURVE_STUDENT = [0.04, 0.02, 0.02, 0.02, 0.02, 0.03, 0.06, 0.1, 0.16, 0.24, 0.3, 0.34, 0.38, 0.42, 0.5, 0.6, 0.74, 0.88, 0.92, 0.86, 0.66, 0.4, 0.18, 0.08];
export const CURVE_PRO = [0.03, 0.02, 0.02, 0.02, 0.02, 0.04, 0.1, 0.22, 0.44, 0.66, 0.82, 0.86, 0.72, 0.84, 0.8, 0.68, 0.52, 0.38, 0.26, 0.18, 0.12, 0.08, 0.05, 0.03];
export const CURVE_CREATOR = [0.06, 0.04, 0.03, 0.02, 0.02, 0.03, 0.05, 0.08, 0.14, 0.22, 0.3, 0.36, 0.4, 0.46, 0.52, 0.62, 0.74, 0.84, 0.9, 0.88, 0.78, 0.56, 0.3, 0.14];

export function baseHeatFor(room: Room, hour: number): number {
  const curve = room.size === "small" ? CURVE_STUDENT : room.size === "medium" ? CURVE_PRO : CURVE_CREATOR;
  // Deterministic per-cell jitter so rows don't look copy-pasted.
  const jitter = (((room.id * 31 + hour * 17) % 13) / 13 - 0.5) * 0.14;
  return Math.min(1, Math.max(0, curve[hour] + jitter));
}

/** Hours the forecast marks as off-peak → dynamic pricing targets. */
export const OFF_PEAK_HOURS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 21, 22, 23]);

export function priceFor(room: Room, hour: number, dynamicPricing: boolean): number {
  if (dynamicPricing && OFF_PEAK_HOURS.has(hour)) {
    return Math.round(room.rate * (1 - OFF_PEAK_DISCOUNT));
  }
  return room.rate;
}

/* ============================================================
   Seeded mock history (fact_bookings + fact_billings)
   ============================================================ */
