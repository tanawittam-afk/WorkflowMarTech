"use client";

/**
 * Closed-Loop Marketing & Room Booking Ecosystem — single-page visualization
 * for Marketing Users of a co-working space rental business. Self-contained:
 * mock data + all sections live in this file. Deliberately does NOT use the
 * app's dark-glass theme tokens — this page is an enterprise-SaaS
 * "clean white / blue" surface regardless of the visitor's theme preference.
 *
 * Bilingual: every display string is an LStr { en, th } resolved through a
 * LangContext (EN default, persisted to localStorage). Technical vocabulary —
 * event names, CRM field names, campaign slugs, brand names, metric acronyms —
 * stays English in both languages. Thai glyphs render via the Anuphan font
 * variable passed in from page.tsx (Bricolage/Inter have no Thai coverage).
 *
 * Signature device: phase lineage colors. Each journey phase (Acquisition →
 * Retention) owns one accent color, and that color follows its data through
 * every section — the CRM fields it populates, the events it emits, and the
 * dashboard widgets it feeds.
 */

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  BadgePercent,
  Banknote,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock,
  Database,
  DoorOpen,
  Filter,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Radio,
  Repeat,
  Target,
  Zap,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
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
   Language plumbing
   ============================================================ */

type Lang = "en" | "th";
type LStr = { en: string; th: string };
/** Content item: LStr when it translates, plain string when it is shared
    technical vocabulary (brands, events, field names, acronyms). */
type Item = string | LStr;

const LANG_STORAGE_KEY = "martech-lang";

/* localStorage as an external store — hydration-safe (server snapshot is
   always "en"; the stored preference applies right after hydration). */
let langListeners: Array<() => void> = [];

function subscribeLang(listener: () => void) {
  langListeners.push(listener);
  return () => {
    langListeners = langListeners.filter((l) => l !== listener);
  };
}

function getLangSnapshot(): Lang {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) === "th" ? "th" : "en";
  } catch {
    return "en";
  }
}

function setStoredLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {}
  for (const listener of langListeners) listener();
}

const LangContext = createContext<Lang>("en");

function useT() {
  const lang = useContext(LangContext);
  return useCallback(
    (s: Item) => (typeof s === "string" ? s : s[lang]),
    [lang],
  );
}

/* ============================================================
   Phase lineage colors (Tailwind literals so v4 picks them up)
   ============================================================ */

type PhaseKey =
  | "acquisition"
  | "conversion"
  | "purchase"
  | "service"
  | "retention";

type PhaseStyle = {
  chip: string; // small label chip
  dot: string; // solid dot / marker
  soft: string; // soft card surface
  ring: string; // active card ring
  text: string; // accent text
  hex: string; // chart color
};

const PHASE_STYLE: Record<PhaseKey, PhaseStyle> = {
  acquisition: {
    chip: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
    soft: "bg-sky-50",
    ring: "ring-sky-500",
    text: "text-sky-700",
    hex: "#0ea5e9",
  },
  conversion: {
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    soft: "bg-emerald-50",
    ring: "ring-emerald-500",
    text: "text-emerald-700",
    hex: "#10b981",
  },
  purchase: {
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    soft: "bg-amber-50",
    ring: "ring-amber-500",
    text: "text-amber-700",
    hex: "#f59e0b",
  },
  service: {
    chip: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
    soft: "bg-violet-50",
    ring: "ring-violet-500",
    text: "text-violet-700",
    hex: "#8b5cf6",
  },
  retention: {
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    soft: "bg-rose-50",
    ring: "ring-rose-500",
    text: "text-rose-700",
    hex: "#f43f5e",
  },
};

/* ============================================================
   Mock data (bilingual)
   ============================================================ */

const KPIS: {
  label: LStr;
  value: number;
  format: (v: number) => string;
  delta: LStr;
  icon: typeof Users;
}[] = [
  {
    label: { en: "Rooms Managed", th: "ห้องที่บริหาร" },
    value: 20,
    format: (v: number) => `${Math.round(v)}`,
    delta: { en: "Small · Medium · Large", th: "เล็ก · กลาง · ใหญ่" },
    icon: DoorOpen,
  },
  {
    label: { en: "Ingestion Touchpoints", th: "จุดนำเข้าข้อมูล" },
    value: 3,
    format: (v: number) => `${Math.round(v)}`,
    delta: { en: "LINE · Web · In-room QR", th: "LINE · เว็บ · QR ในห้อง" },
    icon: Inbox,
  },
  {
    label: { en: "Analytics Models", th: "โมเดลวิเคราะห์" },
    value: 3,
    format: (v: number) => `${Math.round(v)}`,
    delta: { en: "K-Means · Apriori · Forecast", th: "K-Means · Apriori · Forecast" },
    icon: Brain,
  },
  {
    label: { en: "Combined AOV", th: "AOV รวม (ห้อง+น้ำ)" },
    value: 1630,
    format: (v: number) => `฿${Math.round(v).toLocaleString("en-US")}`,
    delta: { en: "Target +15% in 6 months", th: "เป้า +15% ใน 6 เดือน" },
    icon: Banknote,
  },
  {
    label: { en: "Beverage Attach Rate", th: "Beverage Attach Rate" },
    value: 40,
    format: (v: number) => `${Math.round(v)}%`,
    delta: { en: "Target within 6 months", th: "เป้าหมายภายใน 6 เดือน" },
    icon: Target,
  },
];

type PhaseGroup = {
  label: LStr;
  items: Item[];
  flow?: boolean; // render items as a step sequence instead of chips
};

type Phase = {
  key: PhaseKey;
  num: string;
  name: LStr;
  shortName: LStr; // for chips
  icon: typeof Megaphone;
  tagline: LStr;
  groups: PhaseGroup[];
};

const PHASES: Phase[] = [
  {
    key: "acquisition",
    num: "01",
    name: { en: "Data Ingestion", th: "นำเข้าข้อมูล (Data Ingestion)" },
    shortName: { en: "Ingestion", th: "นำเข้าข้อมูล" },
    icon: Inbox,
    tagline: {
      en: "Three touchpoints feed the CDP — all stitched by one LINE UID.",
      th: "3 จุดนำเข้าข้อมูลป้อนเข้า CDP เชื่อมกันด้วย LINE UID เดียว",
    },
    groups: [
      {
        label: { en: "3 Touchpoints", th: "3 จุดนำเข้าข้อมูล" },
        flow: true,
        items: [
          { en: "1 · LINE registration", th: "1 · สมัครสมาชิกผ่าน LINE" },
          { en: "2 · Room booking on web", th: "2 · จองห้องผ่านเว็บ" },
          { en: "3 · In-room QR beverage order", th: "3 · สั่งน้ำผ่าน QR ในห้อง" },
        ],
      },
      {
        label: { en: "Tables Written", th: "ตารางที่เขียนลง" },
        items: ["dim_customers", "fact_bookings", "fact_billings"],
      },
      {
        label: { en: "Join Key", th: "ตัวเชื่อมข้อมูล" },
        items: [
          { en: "Customer ID (LINE UID)", th: "Customer ID (LINE UID)" },
          { en: "Seamless across all three", th: "เชื่อมทั้งสามตารางแบบไร้รอยต่อ" },
        ],
      },
    ],
  },
  {
    key: "conversion",
    num: "02",
    name: { en: "ETL & Data Pipeline", th: "จัดระเบียบข้อมูล (ETL)" },
    shortName: { en: "ETL", th: "จัดระเบียบข้อมูล" },
    icon: Filter,
    tagline: {
      en: "Round 1 (room) and round 2 (beverages) merge into one spend per visit.",
      th: "รวมยอดรอบ 1 (ค่าห้อง) กับรอบ 2 (ค่าน้ำ) เป็นยอดใช้จ่ายเดียวต่อครั้ง",
    },
    groups: [
      {
        label: { en: "Process", th: "ขั้นตอน" },
        flow: true,
        items: [
          { en: "Clean & normalise", th: "ทำความสะอาดและแปลงค่าข้อมูล" },
          { en: "Merge round 1 + round 2", th: "รวมยอดรอบ 1 + รอบ 2" },
          { en: "Derive time variables", th: "แยกตัวแปรเชิงเวลา" },
          { en: "Analysis-ready dataset", th: "ได้ข้อมูลพร้อมวิเคราะห์" },
        ],
      },
      {
        label: { en: "Engineered Features", th: "ตัวแปรที่สร้างขึ้น" },
        items: [
          { en: "Total spend per visit", th: "ยอดใช้จ่ายรวมต่อครั้ง" },
          { en: "Peak / off-peak hour", th: "ชั่วโมงเร่งด่วน / นอกเวลาเร่งด่วน" },
          { en: "Day of week", th: "วันในสัปดาห์" },
          { en: "Session duration", th: "ระยะเวลาที่นั่ง" },
        ],
      },
      {
        label: { en: "Feeds", th: "ส่งต่อไปยัง" },
        items: [
          { en: "K-Means · Apriori · Forecasting", th: "K-Means · Apriori · Forecasting" },
        ],
      },
    ],
  },
  {
    key: "purchase",
    num: "03",
    name: { en: "Advanced Analytics", th: "โมเดลวิเคราะห์ขั้นสูง" },
    shortName: { en: "Analytics", th: "โมเดลวิเคราะห์" },
    icon: Brain,
    tagline: {
      en: "Three models turn the cleaned dataset into personas, bundles, and forecasts.",
      th: "3 โมเดลเปลี่ยนข้อมูลที่สะอาดแล้วเป็น Persona, เซ็ตคู่ และการพยากรณ์",
    },
    groups: [
      {
        label: { en: "Model 1 · K-Means Clustering", th: "โมเดล 1 · K-Means Clustering" },
        items: [
          { en: "In: recency, frequency, spend, hour, occupation", th: "เข้า: ความถี่ล่าสุด, ความถี่รวม, ยอดเงิน, ช่วงเวลา, อาชีพ" },
          { en: "Out: Student / Freelancer / Creator personas", th: "ออก: Persona นักศึกษา / ฟรีแลนซ์ / ครีเอเตอร์" },
        ],
      },
      {
        label: { en: "Model 2 · Apriori Association", th: "โมเดล 2 · Apriori (Market Basket)" },
        items: [
          { en: "In: room type, time slot, beverage lines", th: "เข้า: ประเภทห้อง, ช่วงเวลา, รายการเครื่องดื่ม" },
          { en: "Out: e.g. Creator Studio + evening ⇒ Energy Drink, Lift > 2.5", th: "ออก: เช่น Creator Studio + ช่วงเย็น ⇒ Energy Drink, Lift > 2.5" },
        ],
      },
      {
        label: { en: "Model 3 · Time-Series Forecasting", th: "โมเดล 3 · Time-Series Forecasting" },
        items: [
          { en: "In: historical booking_datetime", th: "เข้า: ประวัติ booking_datetime ย้อนหลัง" },
          { en: "Out: peak vs off-peak demand forecast", th: "ออก: พยากรณ์ Demand แยกช่วง Peak / Off-Peak" },
        ],
      },
    ],
  },
  {
    key: "service",
    num: "04",
    name: { en: "Data Activation", th: "นำข้อมูลไปใช้จริง (Activation)" },
    shortName: { en: "Activation", th: "ใช้งานจริง" },
    icon: Zap,
    tagline: {
      en: "Model output becomes buttons a marketer can press today.",
      th: "ผลจากโมเดลกลายเป็นปุ่มที่นักการตลาดกดใช้ได้ทันที",
    },
    groups: [
      {
        label: { en: "LINE OA Automation", th: "การตลาดอัตโนมัติผ่าน LINE OA" },
        items: [
          { en: "Booked > 2h with no beverage ⇒ auto 20% coffee coupon", th: "จองเกิน 2 ชม. ยังไม่สั่งน้ำ ⇒ ส่งคูปองกาแฟ 20% อัตโนมัติ" },
          { en: "Churn risk > 25 days ⇒ Sync & Send Coupon", th: "เสี่ยงหาย ไม่จองเกิน 25 วัน ⇒ ปุ่ม Sync & Send Coupon" },
        ],
      },
      {
        label: { en: "Booking Site Personalisation", th: "ปรับหน้าเว็บจองห้อง" },
        items: [
          { en: "Smart Bundling pop-up on the confirm page", th: "ป๊อปอัพเซ็ตคู่ (ห้อง+น้ำ) บนหน้ายืนยันการจอง" },
          { en: "Dynamic Pricing: off-peak −15–20%", th: "Dynamic Pricing: ลดราคานอกชั่วโมงเร่งด่วน 15–20%" },
        ],
      },
      {
        label: { en: "Driven By", th: "ขับเคลื่อนโดย" },
        items: [
          { en: "Apriori ⇒ bundles", th: "Apriori ⇒ เซ็ตคู่" },
          { en: "Forecasting ⇒ pricing", th: "Forecasting ⇒ ราคา" },
          { en: "K-Means ⇒ targeting", th: "K-Means ⇒ เลือกกลุ่มเป้าหมาย" },
        ],
      },
    ],
  },
  {
    key: "retention",
    num: "05",
    name: {
      en: "Measure & Close the Loop",
      th: "วัดผลและวนกลับ (Closed Loop)",
    },
    shortName: { en: "Measure", th: "วัดผล" },
    icon: Repeat,
    tagline: {
      en: "Results are scored against three objectives, then retrain the models.",
      th: "วัดผลกับวัตถุประสงค์ 3 ข้อ แล้วป้อนกลับไปเทรนโมเดลรอบถัดไป",
    },
    groups: [
      {
        label: { en: "3 Objectives (6 months)", th: "วัตถุประสงค์ 3 ข้อ (ใน 6 เดือน)" },
        items: [
          { en: "1 · Room revenue +15%", th: "1 · ยอดขายจากการจองห้อง +15%" },
          { en: "2 · Beverage attach rate → 40%", th: "2 · Beverage Attach Rate → 40%" },
          { en: "3 · Combined AOV +15%", th: "3 · AOV รวม (ห้อง+น้ำ) +15%" },
        ],
      },
      {
        label: { en: "Tracked On", th: "ติดตามผลที่" },
        items: [
          { en: "Goal progress bars on the dashboard", th: "แถบความคืบหน้าเป้าหมายบนแดชบอร์ด" },
          { en: "8 core KPIs", th: "8 ดัชนีชี้วัดหลัก" },
        ],
      },
      {
        label: { en: "Feeds Back Into", th: "ป้อนกลับเข้าสู่" },
        flow: true,
        items: [
          { en: "New behavioural data", th: "ข้อมูลพฤติกรรมชุดใหม่" },
          { en: "Retrain the 3 models", th: "เทรน 3 โมเดลใหม่" },
          { en: "Sharper personas & bundles", th: "Persona และเซ็ตคู่ที่แม่นขึ้น" },
        ],
      },
    ],
  },
];

type CrmField = {
  name: string;
  type: string;
  sample: string;
  source: PhaseKey;
};

const CRM_FIELDS: CrmField[] = [
  // dim_customers — touchpoint 1 (LINE registration)
  { name: "dim_customers.line_uid", type: "id", sample: "U2b9d1e42", source: "acquisition" },
  { name: "dim_customers.occupation", type: "text", sample: "นักศึกษา", source: "acquisition" },
  // fact_bookings — touchpoint 2 (web booking)
  { name: "fact_bookings.booking_id", type: "id", sample: "BK-0421", source: "acquisition" },
  { name: "fact_bookings.room_id", type: "id", sample: "RM-07 (Medium)", source: "acquisition" },
  { name: "fact_bookings.duration_hours", type: "int", sample: "3", source: "acquisition" },
  { name: "fact_bookings.room_amount", type: "currency", sample: "฿1,500", source: "acquisition" },
  // fact_billings — touchpoint 3 (in-room QR)
  { name: "fact_billings.items", type: "array", sample: "ชาไทย ×2", source: "acquisition" },
  { name: "fact_billings.beverage_amount", type: "currency", sample: "฿130", source: "acquisition" },
  // derived in the ETL step
  { name: "total_spend", type: "currency", sample: "฿1,630", source: "conversion" },
  { name: "is_off_peak", type: "bool", sample: "true", source: "conversion" },
  // written back by the analytics models
  { name: "persona_cluster", type: "enum", sample: "Student", source: "purchase" },
  { name: "churn_risk_days", type: "int", sample: "27", source: "purchase" },
];

const EVENT_GROUPS: { phase: PhaseKey; events: string[] }[] = [
  {
    phase: "acquisition",
    events: [
      "line_register",
      "view_room",
      "booking_submit",
      "booking_paid",
      "qr_scan_in_room",
      "beverage_order",
      "checkout_round2",
    ],
  },
  {
    phase: "conversion",
    events: ["etl_merge_rounds", "derive_time_features"],
  },
  {
    phase: "purchase",
    events: ["cluster_assigned", "bundle_rule_matched", "demand_forecast_run"],
  },
  {
    phase: "service",
    events: [
      "line_coupon_sent",
      "winback_coupon_sent",
      "bundle_offer_shown",
      "dynamic_price_applied",
    ],
  },
  {
    phase: "retention",
    events: ["csat_submitted", "goal_progress_updated"],
  },
];

const DESTINATIONS: { name: string; note: LStr; icon: typeof BarChart3 }[] = [
  {
    name: "LINE OA",
    note: {
      en: "Automated action 1 — in-room coffee coupons and win-back coupons fire straight to the customer's LINE.",
      th: "ระบบอัตโนมัติที่ 1 — คูปองกาแฟในห้องและคูปองดึงลูกค้ากลับ ยิงเข้า LINE ของลูกค้าโดยตรง",
    },
    icon: Radio,
  },
  {
    name: "Booking Site",
    note: {
      en: "Automated action 2 — Smart Bundling pop-ups and off-peak Dynamic Pricing reshape the booking page.",
      th: "ระบบอัตโนมัติที่ 2 — ป๊อปอัพเซ็ตคู่และ Dynamic Pricing นอกชั่วโมงเร่งด่วน ปรับหน้าเว็บจอง",
    },
    icon: BadgePercent,
  },
  {
    name: "CDP",
    note: {
      en: "Events land in dim_customers / fact_bookings / fact_billings, joined on LINE UID.",
      th: "อีเวนต์ลงตาราง dim_customers / fact_bookings / fact_billings เชื่อมด้วย LINE UID",
    },
    icon: Database,
  },
  {
    name: "Dashboard",
    note: {
      en: "Events aggregate into the 8 core KPIs and the three goal progress bars.",
      th: "อีเวนต์ถูกรวมเป็น 8 ดัชนีชี้วัดหลักและแถบความคืบหน้าเป้าหมาย 3 ข้อ",
    },
    icon: LayoutDashboard,
  },
];

const TRAFFIC_SOURCES = [
  { name: "Facebook Ads", value: 34 },
  { name: "Google Search", value: 26 },
  { name: "SEO", value: 18 },
  { name: "LINE OA", value: 14 },
  { name: "QR Code", value: 8 },
];

const TRAFFIC_COLORS = ["#2563eb", "#0ea5e9", "#38bdf8", "#818cf8", "#a5b4fc"];

const CAMPAIGNS = [
  { campaign: "exam-season-fb", bookings: 212 },
  { campaign: "corporate-rebook-line", bookings: 164 },
  { campaign: "happy-hour-line", bookings: 141 },
  { campaign: "monthly-desk-google", bookings: 118 },
  { campaign: "organic / none", bookings: 86 },
];

const REVENUE_TREND = [
  { month: "Feb", revenue: 388 },
  { month: "Mar", revenue: 424 },
  { month: "Apr", revenue: 471 },
  { month: "May", revenue: 519 },
  { month: "Jun", revenue: 557 },
  { month: "Jul", revenue: 642 },
];

const POPULAR_ROOMS = [
  { room: "Meeting A", bookings: 176 },
  { room: "Meeting B", bookings: 158 },
  { room: "Hot Desk", bookings: 121 },
  { room: "Office 1", bookings: 104 },
  { room: "Office 2", bookings: 92 },
  { room: "Event Space", bookings: 71 },
];

const PEAK_HOURS = [
  { hour: "09", load: 0.22 },
  { hour: "10", load: 0.35 },
  { hour: "11", load: 0.48 },
  { hour: "12", load: 0.42 },
  { hour: "13", load: 0.55 },
  { hour: "14", load: 0.62 },
  { hour: "15", load: 0.68 },
  { hour: "16", load: 0.74 },
  { hour: "17", load: 0.86 },
  { hour: "18", load: 1.0 },
  { hour: "19", load: 0.95 },
  { hour: "20", load: 0.78 },
  { hour: "21", load: 0.52 },
  { hour: "22", load: 0.3 },
];

const GOALS: LStr[] = [
  {
    en: "Objective 1 — grow total room-booking revenue by 15% within 6 months, using persona-targeted promotions",
    th: "วัตถุประสงค์ที่ 1 — เพิ่มยอดขายรวมจากการจองห้อง 15% ภายใน 6 เดือน ด้วยโปรโมชันตามกลุ่มพฤติกรรม (Persona)",
  },
  {
    en: "Objective 2 — lift the beverage attach rate to 40% within 6 months, via Smart Bundling and in-room LINE OA nudges",
    th: "วัตถุประสงค์ที่ 2 — เพิ่ม Beverage Attach Rate ให้ถึง 40% ภายใน 6 เดือน ด้วย Smart Bundling และการแจ้งเตือนผ่าน LINE OA ในห้อง",
  },
  {
    en: "Objective 3 — raise combined AOV (room + round-2 beverage bill) by 15% within 6 months",
    th: "วัตถุประสงค์ที่ 3 — เพิ่ม AOV รวม (ค่าห้อง + บิลค่าน้ำรอบสอง) ขึ้น 15% ภายใน 6 เดือน",
  },
];

const NAV_LINKS: { href: string; label: LStr }[] = [
  { href: "#workflow", label: { en: "Workflow", th: "เวิร์กโฟลว์" } },
  { href: "#crm", label: { en: "CRM", th: "CRM" } },
  { href: "#events", label: { en: "Events", th: "อีเวนต์" } },
  { href: "#dashboard", label: { en: "Dashboard", th: "แดชบอร์ด" } },
];

/* ============================================================
   Primitives
   ============================================================ */

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const HEADING_FONT =
  "font-[family-name:var(--font-bricolage),var(--font-anuphan)]";

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

function CountUp({
  value,
  format,
}: {
  value: number;
  format: (v: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    if (reduced) {
      node.textContent = format(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.4,
      ease: EASE_OUT,
      onUpdate: (v) => {
        node.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [inView, value, format, reduced]);

  return <span ref={ref}>{format(0)}</span>;
}

function SectionHeading({
  id,
  eyebrow,
  title,
  blurb,
}: {
  id?: string;
  eyebrow: LStr;
  title: LStr;
  blurb: LStr;
}) {
  const t = useT();
  return (
    <Reveal>
      <div id={id} className="mx-auto max-w-2xl scroll-mt-28 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          {t(eyebrow)}
        </p>
        <h2
          className={`mt-3 ${HEADING_FONT} text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl`}
        >
          {t(title)}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          {t(blurb)}
        </p>
      </div>
    </Reveal>
  );
}

function PhaseChip({ phase }: { phase: PhaseKey }) {
  const t = useT();
  const style = PHASE_STYLE[phase];
  const def = PHASES.find((p) => p.key === phase);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {def ? t(def.shortName) : phase}
    </span>
  );
}

/* ============================================================
   Sections
   ============================================================ */

function LangToggle({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div
      className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5"
      role="group"
      aria-label="Language"
    >
      {(["en", "th"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => onChange(l)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
            lang === l
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {l === "en" ? "EN" : "ไทย"}
        </button>
      ))}
    </div>
  );
}

function TopNav({
  lang,
  onLangChange,
}: {
  lang: Lang;
  onLangChange: (l: Lang) => void;
}) {
  const t = useT();
  const scrollTo = useCallback((href: string) => {
    document
      .querySelector(href)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-[11px] font-bold text-white">
            SS
          </span>
          <span className="truncate text-sm font-semibold text-slate-900">
            Smart Space{" "}
            <span className="font-normal text-slate-400">/ Marketing OS</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollTo(link.href)}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {t(link.label)}
              </button>
            ))}
          </nav>
          <Link
            href="/marketing-user"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            {t({ en: "Marketing User", th: "แดชบอร์ด Marketing User" })}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <LangToggle lang={lang} onChange={onLangChange} />
        </div>
      </div>
    </header>
  );
}

const HERO = {
  badge: {
    en: "Customer Data Platform · Smart Space",
    th: "ระบบ CDP สำหรับธุรกิจเช่าพื้นที่ · Smart Space",
  },
  titlePre: { en: "From three touchpoints to ", th: "จาก 3 จุดนำเข้าข้อมูล สู่" },
  titleHighlight: {
    en: "automated marketing",
    th: "การตลาดอัตโนมัติ",
  },
  titlePost: { en: "", th: "" },
  subtitle: {
    en: "One LINE UID stitches registration, room bookings, and in-room QR beverage orders into a single profile — then three analytics models turn it into personas, bundles, and dynamic prices.",
    th: "LINE UID เดียวเชื่อมการสมัครสมาชิก การจองห้อง และการสั่งเครื่องดื่มผ่าน QR ในห้อง ให้เป็นโปรไฟล์เดียว แล้วส่งต่อให้ 3 โมเดลวิเคราะห์แปลงเป็น Persona, เซ็ตคู่ และราคาแบบไดนามิก",
  },
  ctaPrimary: { en: "Explore the workflow", th: "สำรวจเวิร์กโฟลว์" },
  ctaSecondary: { en: "Open live dashboard", th: "เปิดแดชบอร์ดจริง" },
} as const;

function Hero() {
  const t = useT();
  const reduced = useReducedMotion();
  const scrollToWorkflow = useCallback(() => {
    document
      .querySelector("#workflow")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* quiet blue wash, top only — the rest of the page stays white */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,#eff6ff_0%,rgba(255,255,255,0)_100%)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Megaphone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t(HERO.badge)}
          </p>
          <h1
            className={`mt-6 ${HEADING_FONT} text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.12]`}
          >
            {t(HERO.titlePre)}
            <span className="text-blue-600">{t(HERO.titleHighlight)}</span>
            {t(HERO.titlePost)}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            {t(HERO.subtitle)}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={scrollToWorkflow}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {t(HERO.ctaPrimary)}
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              {t(HERO.ctaSecondary)}
            </Link>
          </div>
        </motion.div>

        {/* KPI cards */}
        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {KPIS.map((kpi, i) => (
            <Reveal key={kpi.label.en} delay={i * 0.07}>
              <div className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-slate-500">
                  <kpi.icon
                    className="h-4 w-4 shrink-0 text-blue-600"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium">{t(kpi.label)}</span>
                </div>
                <p
                  className={`mt-3 ${HEADING_FONT} text-2xl font-bold tabular-nums text-slate-900`}
                >
                  <CountUp value={kpi.value} format={kpi.format} />
                </p>
                <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  {t(kpi.delta)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const LOOP_LABEL: LStr = {
  en: "Closed loop — retention data feeds the next acquisition campaign",
  th: "วงจรปิด — ข้อมูลการรักษาลูกค้าย้อนกลับไปขับเคลื่อนแคมเปญหาลูกค้ารอบถัดไป",
};

function ClosedLoopArrow() {
  const t = useT();
  const reduced = useReducedMotion();
  return (
    <div className="mt-6 hidden lg:block">
      <svg
        viewBox="0 0 1000 64"
        preserveAspectRatio="none"
        className="h-14 w-full"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <marker
            id="loop-arrowhead"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0 0 L8 4 L0 8 Z" fill="#f43f5e" />
          </marker>
        </defs>
        <motion.path
          d="M 910 4 C 910 46, 850 54, 500 54 C 150 54, 90 46, 90 10"
          stroke="#f43f5e"
          strokeWidth="2"
          strokeDasharray="7 7"
          markerEnd="url(#loop-arrowhead)"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        />
      </svg>
      <p className="text-center text-xs font-medium text-rose-600">
        {t(LOOP_LABEL)}
      </p>
    </div>
  );
}

const WORKFLOW_HEADING = {
  eyebrow: { en: "CDP pipeline", th: "ลำดับการทำงานของระบบ CDP" },
  title: {
    en: "Ingest, organise, model, activate, measure",
    th: "นำเข้า จัดระเบียบ วิเคราะห์ ใช้งานจริง แล้ววัดผล",
  },
  blurb: {
    en: "Three ingestion touchpoints feed three analytics models, which drive two automated marketing actions. Select a stage to see what happens inside it.",
    th: "3 จุดนำเข้าข้อมูลป้อนเข้า 3 โมเดลวิเคราะห์ แล้วขับเคลื่อนระบบการตลาดอัตโนมัติ 2 ตัว เลือกขั้นตอนเพื่อดูว่าเกิดอะไรขึ้นข้างใน",
  },
} as const;

function WorkflowSection() {
  const t = useT();
  const [activeKey, setActiveKey] = useState<PhaseKey>("acquisition");
  const active = useMemo(
    () => PHASES.find((p) => p.key === activeKey) ?? PHASES[0],
    [activeKey],
  );
  const reduced = useReducedMotion();

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        id="workflow"
        eyebrow={WORKFLOW_HEADING.eyebrow}
        title={WORKFLOW_HEADING.title}
        blurb={WORKFLOW_HEADING.blurb}
      />

      {/* Phase cards: snap-scroll row on mobile, 5-across grid on lg */}
      <div
        role="tablist"
        aria-label="Journey phases"
        className="mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0"
      >
        {PHASES.map((phase, i) => {
          const style = PHASE_STYLE[phase.key];
          const isActive = phase.key === activeKey;
          return (
            <div
              key={phase.key}
              className="relative min-w-[230px] snap-start lg:min-w-0"
            >
              <Reveal delay={i * 0.06} className="h-full">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="phase-detail"
                  onClick={() => setActiveKey(phase.key)}
                  className={`h-full w-full rounded-xl border bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    isActive
                      ? `border-transparent ring-2 ${style.ring}`
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${style.soft}`}
                    >
                      <phase.icon
                        className={`h-4.5 w-4.5 ${style.text}`}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-slate-400">
                      {phase.num}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-snug text-slate-900">
                    {t(phase.name)}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    {t(phase.tagline)}
                  </p>
                </button>
              </Reveal>
              {/* connector between cards (desktop) */}
              {i < PHASES.length - 1 && (
                <ArrowRight
                  aria-hidden="true"
                  className="absolute -right-[13px] top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-slate-300 lg:block"
                />
              )}
            </div>
          );
        })}
      </div>

      <ClosedLoopArrow />

      {/* Detail panel */}
      <div id="phase-detail" role="tabpanel" className="mt-8 lg:mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.key}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <PhaseChip phase={active.key} />
              <h3 className={`${HEADING_FONT} text-lg font-bold text-slate-900`}>
                {t(active.name)}
              </h3>
              <p className="text-sm text-slate-500">{t(active.tagline)}</p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.groups.map((group) => (
                <div
                  key={group.label.en}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {t(group.label)}
                  </p>
                  {group.flow ? (
                    <ol className="mt-3 space-y-1.5">
                      {group.items.map((item, idx) => (
                        <li
                          key={typeof item === "string" ? item : item.en}
                          className="flex items-center gap-2"
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${PHASE_STYLE[active.key].dot}`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-sm text-slate-700">
                            {t(item)}
                          </span>
                          {idx < group.items.length - 1 && (
                            <ArrowDown
                              className="ml-auto h-3 w-3 shrink-0 text-slate-300"
                              aria-hidden="true"
                            />
                          )}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {group.items.map((item) => (
                        <li
                          key={typeof item === "string" ? item : item.en}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {t(item)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

const CRM_HEADING = {
  eyebrow: { en: "CDP data model", th: "โมเดลข้อมูล CDP" },
  title: {
    en: "Three tables, stitched by one LINE UID",
    th: "3 ตาราง เชื่อมกันด้วย LINE UID เดียว",
  },
  blurb: {
    en: "The three ingestion touchpoints write dim_customers, fact_bookings, and fact_billings. ETL derives the combined spend, and the models write their verdicts back. Field color shows which stage produced it.",
    th: "3 จุดนำเข้าข้อมูลเขียนลง dim_customers, fact_bookings และ fact_billings จากนั้น ETL คำนวณยอดรวม และโมเดลเขียนผลกลับเข้ามา สีของแต่ละฟิลด์บอกว่ามาจากขั้นไหน",
  },
} as const;

const CRM_TABLE_HEADERS: { key: string; label: LStr }[] = [
  { key: "field", label: { en: "Field", th: "ฟิลด์" } },
  { key: "type", label: { en: "Type", th: "ชนิด" } },
  { key: "sample", label: { en: "Sample", th: "ตัวอย่าง" } },
  { key: "captured", label: { en: "Captured in", th: "เก็บจากเฟส" } },
];

function CrmSection() {
  const t = useT();
  return (
    <section className="border-y border-slate-200 bg-slate-50/50">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          id="crm"
          eyebrow={CRM_HEADING.eyebrow}
          title={CRM_HEADING.title}
          blurb={CRM_HEADING.blurb}
        />
        <Reveal className="mt-12">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-900 px-5 py-3">
              <Database className="h-4 w-4 text-blue-400" aria-hidden="true" />
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm font-medium text-slate-100">
                customer_profile
              </span>
              <span className="ml-auto rounded-full bg-slate-700/80 px-2 py-0.5 text-[11px] text-slate-300">
                Customer Profile 360°
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    {CRM_TABLE_HEADERS.map((h) => (
                      <th
                        key={h.key}
                        scope="col"
                        className="px-4 py-2.5 font-semibold first:px-5 last:px-5"
                      >
                        {t(h.label)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRM_FIELDS.map((field) => (
                    <tr
                      key={field.name}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-2.5 font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-slate-900">
                        {field.name}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-slate-500">
                          {field.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-slate-600">
                        {field.sample}
                      </td>
                      <td className="px-5 py-2.5">
                        <PhaseChip phase={field.source} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const EVENTS_HEADING = {
  eyebrow: {
    en: "Event tracking architecture",
    th: "สถาปัตยกรรมการติดตามอีเวนต์",
  },
  title: { en: "18 events, four destinations", th: "18 อีเวนต์ สี่ปลายทาง" },
  blurb: {
    en: "Every step of the pipeline fires a tracked event — from LINE registration through the models to the coupon that goes back out. The same stream powers both automated marketing actions, the CDP tables, and the dashboard.",
    th: "ทุกขั้นของ pipeline ยิงอีเวนต์ที่ติดตามได้ ตั้งแต่สมัคร LINE ผ่านโมเดล จนถึงคูปองที่ยิงกลับออกไป สตรีมเดียวกันนี้ขับเคลื่อนทั้งระบบการตลาดอัตโนมัติ 2 ตัว, ตาราง CDP และแดชบอร์ด",
  },
} as const;

function EventsSection() {
  const reduced = useReducedMotion();
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        id="events"
        eyebrow={EVENTS_HEADING.eyebrow}
        title={EVENTS_HEADING.title}
        blurb={EVENTS_HEADING.blurb}
      />
      <div className="mt-12 grid items-center gap-6 lg:grid-cols-[1.15fr_auto_0.85fr]">
        {/* Event chips grouped by phase */}
        <Reveal>
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {EVENT_GROUPS.map((group) => (
              <div key={group.phase}>
                <PhaseChip phase={group.phase} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {group.events.map((event) => (
                    <code
                      key={event}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-[family-name:var(--font-jetbrains-mono)] text-[12px] text-slate-700"
                    >
                      {event}
                    </code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Flow connector (desktop only) */}
        <div
          aria-hidden="true"
          className="hidden flex-col items-center gap-3 px-2 lg:flex"
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={reduced ? false : { opacity: 0.25 }}
              animate={
                reduced ? undefined : { opacity: [0.25, 1, 0.25], x: [0, 6, 0] }
              }
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.35,
                ease: "easeInOut",
              }}
            >
              <ArrowRight className="h-5 w-5 text-blue-500" />
            </motion.div>
          ))}
        </div>

        {/* Destinations */}
        <div className="grid gap-3">
          {DESTINATIONS.map((dest, i) => (
            <DestinationCard key={dest.name} dest={dest} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DestinationCard({
  dest,
  index,
}: {
  dest: (typeof DESTINATIONS)[number];
  index: number;
}) {
  const t = useT();
  return (
    <Reveal delay={index * 0.08}>
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
          <dest.icon className="h-4.5 w-4.5 text-blue-600" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{dest.name}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {t(dest.note)}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

function WidgetCard({
  title,
  phase,
  children,
  className,
}: {
  title: LStr;
  phase: PhaseKey;
  children: ReactNode;
  className?: string;
}) {
  const t = useT();
  return (
    <div
      className={`flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{t(title)}</p>
        <PhaseChip phase={phase} />
      </div>
      <div className="mt-3 flex-1">{children}</div>
    </div>
  );
}

const chartTooltipStyle = {
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
  fontSize: 12,
} as const;

function StatBlock({
  label,
  value,
  sub,
}: {
  label: LStr;
  value: string;
  sub: string;
}) {
  const t = useT();
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{t(label)}</p>
      <p
        className={`mt-1 ${HEADING_FONT} text-xl font-bold tabular-nums text-slate-900`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-emerald-700">{sub}</p>
    </div>
  );
}

const DASHBOARD_HEADING = {
  eyebrow: { en: "Marketing dashboard", th: "แดชบอร์ดการตลาด" },
  title: {
    en: "What marketing sees every morning",
    th: "สิ่งที่ทีมการตลาดเห็นทุกเช้า",
  },
  blurb: {
    en: "The closed loop ends in one screen: acquisition, conversion, retention, and operations — each widget tagged with the phase that feeds it.",
    th: "วงจรปิดจบที่หน้าจอเดียว: หาลูกค้า คอนเวอร์ชัน รักษาลูกค้า และการใช้พื้นที่ — ทุกวิดเจ็ตติดป้ายสีของเฟสที่ป้อนข้อมูลให้",
  },
} as const;

const WIDGET_TITLES = {
  traffic: { en: "Traffic Sources", th: "ช่องทางทราฟฟิก" },
  campaigns: {
    en: "Campaign Performance (bookings)",
    th: "ผลงานแคมเปญ (จำนวนการจอง)",
  },
  conversion: { en: "Conversion & Revenue", th: "คอนเวอร์ชัน & รายได้" },
  retention: { en: "Retention Health", th: "สุขภาพการรักษาลูกค้า" },
  rooms: { en: "Most Popular Space", th: "พื้นที่ยอดนิยม" },
  peak: { en: "Peak Booking Hours", th: "ช่วงเวลาจองหนาแน่น" },
} as const;

const STAT_LABELS = {
  bookingRate: { en: "Booking Rate", th: "อัตราการจอง" },
  revenue: { en: "Revenue", th: "รายได้" },
  roas: { en: "Attach Rate", th: "Attach Rate" },
  repeatRate: { en: "Repeat Rate", th: "อัตราจองซ้ำ" },
  clv: { en: "CLV", th: "CLV" },
  nps: { en: "CSAT", th: "CSAT" },
} as const;

const NPS_MIX_LABEL: LStr = { en: "CSAT response mix", th: "สัดส่วนคำตอบ CSAT" };

const AUTOMATION_NOTE = {
  lead: { en: "Automation firing now:", th: "การตลาดอัตโนมัติที่กำลังทำงาน:" },
  body: {
    en: "Booked > 2h with no beverage → auto 20% coffee coupon; no booking for 25+ days → win-back coupon; Apriori match → Smart Bundling pop-up.",
    th: "จองเกิน 2 ชม. ยังไม่สั่งน้ำ → คูปองกาแฟ 20% อัตโนมัติ; ไม่จองเกิน 25 วัน → คูปองดึงกลับ; เข้ากฎ Apriori → ป๊อปอัพเซ็ตคู่",
  },
} as const;

const PEAK_NOTE: LStr = {
  en: "Forecasting marks 17:00–19:00 as peak — Dynamic Pricing discounts the off-peak hours instead.",
  th: "โมเดล Forecasting ระบุ 17:00–19:00 เป็นช่วงพีค — Dynamic Pricing จึงไปลดราคาช่วงนอกพีคแทน",
};

function DashboardSection() {
  const t = useT();
  return (
    <section className="border-y border-slate-200 bg-slate-50/50">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          id="dashboard"
          eyebrow={DASHBOARD_HEADING.eyebrow}
          title={DASHBOARD_HEADING.title}
          blurb={DASHBOARD_HEADING.blurb}
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
          {/* Acquisition */}
          <Reveal className="xl:col-span-4">
            <WidgetCard
              title={WIDGET_TITLES.traffic}
              phase="acquisition"
              className="h-full"
            >
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={TRAFFIC_SOURCES}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {TRAFFIC_SOURCES.map((entry, i) => (
                        <Cell key={entry.name} fill={TRAFFIC_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v, name) => [`${v}%`, String(name)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                {TRAFFIC_SOURCES.map((source, i) => (
                  <li
                    key={source.name}
                    className="flex items-center gap-1.5 text-xs text-slate-600"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: TRAFFIC_COLORS[i] }}
                    />
                    {source.name}
                    <span className="ml-auto tabular-nums text-slate-400">
                      {source.value}%
                    </span>
                  </li>
                ))}
              </ul>
            </WidgetCard>
          </Reveal>

          <Reveal delay={0.06} className="xl:col-span-8">
            <WidgetCard
              title={WIDGET_TITLES.campaigns}
              phase="acquisition"
              className="h-full"
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={CAMPAIGNS}
                    layout="vertical"
                    margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="campaign"
                      width={168}
                      tick={{
                        fontSize: 11,
                        fill: "#475569",
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "#f8fafc" }}
                    />
                    <Bar
                      dataKey="bookings"
                      fill="#2563eb"
                      radius={[0, 4, 4, 0]}
                      barSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </WidgetCard>
          </Reveal>

          {/* Conversion */}
          <Reveal className="md:col-span-2 xl:col-span-7">
            <WidgetCard
              title={WIDGET_TITLES.conversion}
              phase="purchase"
              className="h-full"
            >
              <div className="grid grid-cols-3 gap-3">
                <StatBlock
                  label={STAT_LABELS.bookingRate}
                  value="2.7%"
                  sub="+0.3pt"
                />
                <StatBlock
                  label={STAT_LABELS.revenue}
                  value="฿642K"
                  sub="+15.2%"
                />
                <StatBlock label={STAT_LABELS.roas} value="34%" sub="+6pt" />
              </div>
              <div className="mt-4 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={REVENUE_TREND}
                    margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#2563eb"
                          stopOpacity={0.22}
                        />
                        <stop
                          offset="100%"
                          stopColor="#2563eb"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `฿${v}K`}
                      width={52}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v) => [`฿${v}K`, "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="url(#revFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </WidgetCard>
          </Reveal>

          {/* Retention */}
          <Reveal delay={0.06} className="xl:col-span-5">
            <WidgetCard
              title={WIDGET_TITLES.retention}
              phase="retention"
              className="h-full"
            >
              <div className="grid grid-cols-3 gap-3">
                <StatBlock
                  label={STAT_LABELS.repeatRate}
                  value="38%"
                  sub="+5pt"
                />
                <StatBlock label={STAT_LABELS.clv} value="฿4,120" sub="+9.4%" />
                <StatBlock label={STAT_LABELS.nps} value="4.6 / 5" sub="+0.3" />
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500">
                  {t(NPS_MIX_LABEL)}
                </p>
                <div
                  className="mt-2 flex h-3 w-full overflow-hidden rounded-full"
                  role="img"
                  aria-label="CSAT mix: 56% rated 5 stars, 30% rated 4, 14% rated 3 or below"
                >
                  <div className="bg-emerald-500" style={{ width: "56%" }} />
                  <div className="bg-slate-300" style={{ width: "30%" }} />
                  <div className="bg-rose-400" style={{ width: "14%" }} />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>5★ 56%</span>
                  <span>4★ 30%</span>
                  <span>≤3★ 14%</span>
                </div>
                <p className="mt-4 rounded-lg border border-rose-100 bg-rose-50/60 p-3 text-xs leading-relaxed text-slate-600">
                  <span className="font-semibold text-rose-700">
                    {t(AUTOMATION_NOTE.lead)}
                  </span>{" "}
                  {t(AUTOMATION_NOTE.body)}
                </p>
              </div>
            </WidgetCard>
          </Reveal>

          {/* Operations */}
          <Reveal className="xl:col-span-7">
            <WidgetCard
              title={WIDGET_TITLES.rooms}
              phase="service"
              className="h-full"
            >
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={POPULAR_ROOMS}
                    margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="room"
                      tick={{ fontSize: 11, fill: "#475569" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "#f8fafc" }}
                    />
                    <Bar
                      dataKey="bookings"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                      barSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </WidgetCard>
          </Reveal>

          <Reveal delay={0.06} className="xl:col-span-5">
            <WidgetCard
              title={WIDGET_TITLES.peak}
              phase="service"
              className="h-full"
            >
              <div
                className="flex h-40 items-end gap-1"
                role="img"
                aria-label="Peak booking hours: demand builds through the afternoon and peaks at 18:00"
              >
                {PEAK_HOURS.map((slot) => (
                  <div
                    key={slot.hour}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-sm bg-blue-600"
                      style={{
                        height: `${Math.max(slot.load * 100, 6)}%`,
                        opacity: 0.25 + slot.load * 0.75,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex gap-1">
                {PEAK_HOURS.map((slot) => (
                  <span
                    key={slot.hour}
                    className="flex-1 text-center font-[family-name:var(--font-jetbrains-mono)] text-[9px] text-slate-400"
                  >
                    {slot.hour}
                  </span>
                ))}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock
                  className="h-3.5 w-3.5 shrink-0 text-blue-600"
                  aria-hidden="true"
                />
                {t(PEAK_NOTE)}
              </p>
            </WidgetCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const GOALS_FOOTER = {
  title: {
    en: "Key goals for marketing users",
    th: "เป้าหมายหลักของทีมการตลาด",
  },
  blurb: {
    en: "The loop exists to move three numbers. Everything on this page feeds one of them.",
    th: "วงจรนี้มีไว้ขยับตัวเลข 3 ตัว ทุกอย่างในหน้านี้ป้อนเข้าวัตถุประสงค์ข้อใดข้อหนึ่งเสมอ",
  },
  credit: {
    en: "Smart Space — Marketing OS · demo visualization with mock data",
    th: "Smart Space — Marketing OS · หน้าสาธิตด้วยข้อมูลจำลอง",
  },
  loop: {
    en: "back to Data Ingestion",
    th: "วนกลับไปนำเข้าข้อมูล",
  },
} as const;

function GoalsFooter() {
  const t = useT();
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="rounded-2xl bg-blue-600 px-6 py-10 sm:px-10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-md">
                <h2 className={`${HEADING_FONT} text-2xl font-bold text-white`}>
                  {t(GOALS_FOOTER.title)}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-blue-100">
                  {t(GOALS_FOOTER.blurb)}
                </p>
              </div>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {GOALS.map((goal) => (
                  <li
                    key={goal.en}
                    className="flex items-start gap-2 text-sm text-white"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-blue-200"
                      aria-hidden="true"
                    />
                    {t(goal)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <p>{t(GOALS_FOOTER.credit)}</p>
          <p className="flex items-center gap-1.5">
            <BadgePercent className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Ingestion → ETL → Analytics → Activation → Measure →{" "}
            <span className="text-rose-500">{t(GOALS_FOOTER.loop)}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   Page
   ============================================================ */

export default function MartechWorkflow({
  fontClass = "",
}: {
  fontClass?: string;
}) {
  const lang = useSyncExternalStore(
    subscribeLang,
    getLangSnapshot,
    (): Lang => "en",
  );
  const handleLangChange = useCallback((l: Lang) => setStoredLang(l), []);

  return (
    <LangContext.Provider value={lang}>
      <div
        lang={lang}
        className={`${fontClass} min-h-screen bg-white text-slate-900 antialiased [font-family:var(--font-inter),var(--font-anuphan),sans-serif]`}
      >
        <TopNav lang={lang} onLangChange={handleLangChange} />
        <Hero />
        <WorkflowSection />
        <CrmSection />
        <EventsSection />
        <DashboardSection />
        <GoalsFooter />
      </div>
    </LangContext.Provider>
  );
}
