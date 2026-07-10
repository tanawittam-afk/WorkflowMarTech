"use client";

/**
 * Closed-Loop Marketing & Room Booking Ecosystem — single-page visualization
 * for Marketing Users. Self-contained: mock data + all sections live in this
 * file. Deliberately does NOT use the app's dark-glass theme tokens — this
 * page is an enterprise-SaaS "clean white / blue" surface regardless of the
 * visitor's theme preference.
 *
 * Signature device: phase lineage colors. Each journey phase (Acquisition →
 * Retention) owns one accent color, and that color follows its data through
 * every section — the CRM fields it populates, the events it emits, and the
 * dashboard widgets it feeds.
 */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Database,
  DoorOpen,
  LayoutDashboard,
  Megaphone,
  MousePointerClick,
  Radio,
  Repeat,
  Target,
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
   Mock data
   ============================================================ */

const KPIS = [
  {
    label: "Website Visitors",
    value: 48200,
    format: (v: number) => `${Math.round(v).toLocaleString("en-US")}`,
    delta: "+12.4% vs last month",
    icon: Users,
  },
  {
    label: "Bookings",
    value: 1284,
    format: (v: number) => `${Math.round(v).toLocaleString("en-US")}`,
    delta: "+8.1% vs last month",
    icon: CalendarCheck,
  },
  {
    label: "Revenue",
    value: 642000,
    format: (v: number) => `฿${Math.round(v).toLocaleString("en-US")}`,
    delta: "+15.2% vs last month",
    icon: Banknote,
  },
  {
    label: "ROAS",
    value: 4.8,
    format: (v: number) => `${v.toFixed(1)}x`,
    delta: "+0.6x vs last month",
    icon: Target,
  },
  {
    label: "Repeat Booking Rate",
    value: 38,
    format: (v: number) => `${Math.round(v)}%`,
    delta: "+5pt vs last month",
    icon: Repeat,
  },
];

type PhaseGroup = {
  label: string;
  items: string[];
  flow?: boolean; // render items as a step sequence instead of chips
};

type Phase = {
  key: PhaseKey;
  num: string;
  name: string;
  icon: typeof Megaphone;
  tagline: string;
  groups: PhaseGroup[];
};

const PHASES: Phase[] = [
  {
    key: "acquisition",
    num: "01",
    name: "Acquisition",
    icon: Megaphone,
    tagline: "Campaigns bring trackable traffic to the booking site.",
    groups: [
      {
        label: "Traffic Sources",
        items: ["Facebook Ads", "Google Search", "SEO", "LINE OA", "QR Code"],
      },
      {
        label: "Marketing Tracking",
        items: ["UTM Parameters", "Meta Pixel", "Google Analytics 4"],
      },
      {
        label: "Captured Data",
        items: ["Source", "Campaign", "Medium", "Landing Page"],
      },
    ],
  },
  {
    key: "conversion",
    num: "02",
    name: "Conversion",
    icon: MousePointerClick,
    tagline: "Visitors become booking intent — enriched with who they are.",
    groups: [
      {
        label: "Customer Actions",
        flow: true,
        items: [
          "View Room",
          "Select Room",
          "Check Availability",
          "Enter Booking Information",
        ],
      },
      {
        label: "Marketing Features",
        items: [
          "Promo Code",
          "Dynamic Pricing",
          "Usage Purpose Selection",
          "Customer Type Selection",
        ],
      },
      {
        label: "Captured Data",
        items: ["Customer Type", "Usage Purpose", "Promo Code", "Booking Intent"],
      },
    ],
  },
  {
    key: "purchase",
    num: "03",
    name: "Purchase",
    icon: CreditCard,
    tagline: "Payment closes the funnel and fires the purchase event.",
    groups: [
      {
        label: "Process",
        flow: true,
        items: [
          "Customer Payment",
          "Staff Verification",
          "Booking Confirmation",
          "QR Generation",
        ],
      },
      {
        label: "Marketing Tracking",
        items: ["Purchase Event"],
      },
      {
        label: "Metrics",
        items: ["Revenue", "Conversion Rate", "ROAS"],
      },
    ],
  },
  {
    key: "service",
    num: "04",
    name: "Service",
    icon: DoorOpen,
    tagline: "The visit itself becomes behavioral data.",
    groups: [
      {
        label: "Process",
        flow: true,
        items: [
          "Check-in",
          "Room Usage",
          "Check-out",
          "Cleaning",
          "Room Available",
        ],
      },
      {
        label: "Captured Data",
        items: ["Check-in Time", "Check-out Time", "Room Utilization"],
      },
    ],
  },
  {
    key: "retention",
    num: "05",
    name: "Retention & Optimization",
    icon: Repeat,
    tagline: "CRM turns one booking into the next campaign.",
    groups: [
      {
        label: "Features",
        items: [
          "CRM Database",
          "Customer Segmentation",
          "Marketing Automation",
          "Retargeting Campaigns",
          "NPS Collection",
        ],
      },
      {
        label: "Segments",
        items: ["Students", "Corporate", "Tutors", "Content Creators"],
      },
      {
        label: "Automation Examples",
        items: [
          "Exam Season Promotion",
          "Corporate Rebooking Campaign",
          "Happy Hour Promotion",
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
  { name: "customer_id", type: "id", sample: "CUST-0042", source: "conversion" },
  { name: "customer_type", type: "enum", sample: "Student", source: "conversion" },
  { name: "usage_purpose", type: "enum", sample: "Exam prep", source: "conversion" },
  { name: "first_campaign", type: "text", sample: "exam-season-fb", source: "acquisition" },
  { name: "last_campaign", type: "text", sample: "happy-hour-line", source: "acquisition" },
  { name: "booking_count", type: "int", sample: "7", source: "purchase" },
  { name: "revenue", type: "currency", sample: "฿5,250", source: "purchase" },
  { name: "nps_score", type: "int 0–10", sample: "9", source: "retention" },
  { name: "preferred_room", type: "text", sample: "Studio B", source: "service" },
  { name: "preferred_time_slot", type: "text", sample: "18:00–20:00", source: "service" },
];

const EVENT_GROUPS: { phase: PhaseKey; label: string; events: string[] }[] = [
  { phase: "acquisition", label: "Acquisition", events: ["page_view"] },
  {
    phase: "conversion",
    label: "Conversion",
    events: [
      "view_room",
      "select_room",
      "begin_booking",
      "apply_promo_code",
      "booking_submit",
    ],
  },
  {
    phase: "purchase",
    label: "Purchase",
    events: ["payment_start", "purchase", "qr_generated"],
  },
  { phase: "service", label: "Service", events: ["check_in", "check_out"] },
  {
    phase: "retention",
    label: "Retention",
    events: ["survey_completed", "repeat_booking"],
  },
];

const DESTINATIONS = [
  {
    name: "GA4",
    note: "All 13 events land in Google Analytics 4 for funnel & attribution reports.",
    icon: BarChart3,
  },
  {
    name: "Meta Pixel",
    note: "Funnel and purchase events feed ad optimization via Pixel + CAPI.",
    icon: Radio,
  },
  {
    name: "CRM",
    note: "Events join to a customer identity and update the profile in real time.",
    icon: Database,
  },
  {
    name: "Dashboard",
    note: "Events aggregate into the daily metrics marketing reviews each morning.",
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
  { campaign: "creator-studio-google", bookings: 118 },
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
  { room: "Studio B", bookings: 176 },
  { room: "Studio A", bookings: 158 },
  { room: "Meeting 1", bookings: 121 },
  { room: "Hot Desk", bookings: 104 },
  { room: "Meeting 2", bookings: 92 },
  { room: "Cafe Bar", bookings: 71 },
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

const GOALS = [
  "Lower cost per booking with attribution you can trust",
  "Grow revenue and ROI campaign by campaign",
  "Retain customers and increase repeat bookings",
  "Plan the next campaign from data, not guesswork",
];

const NAV_LINKS = [
  { href: "#workflow", label: "Workflow" },
  { href: "#crm", label: "CRM" },
  { href: "#events", label: "Events" },
  { href: "#dashboard", label: "Dashboard" },
];

/* ============================================================
   Primitives
   ============================================================ */

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

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
  eyebrow: string;
  title: string;
  blurb: string;
}) {
  return (
    <Reveal>
      <div id={id} className="mx-auto max-w-2xl scroll-mt-28 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-bricolage)] text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-600">{blurb}</p>
      </div>
    </Reveal>
  );
}

function PhaseChip({ phase }: { phase: PhaseKey }) {
  const style = PHASE_STYLE[phase];
  const label = PHASES.find((p) => p.key === phase)?.name.split(" ")[0];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

/* ============================================================
   Sections
   ============================================================ */

function TopNav() {
  const scrollTo = useCallback((href: string) => {
    document
      .querySelector(href)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-[11px] font-bold text-white">
            SS
          </span>
          <span className="text-sm font-semibold text-slate-900">
            Smart Space{" "}
            <span className="font-normal text-slate-400">/ Marketing OS</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => scrollTo(link.href)}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Hero() {
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
            <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
            Marketing-Centric Room Booking Workflow
          </p>
          <h1 className="mt-6 font-[family-name:var(--font-bricolage)] text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
            Closed-Loop Marketing &{" "}
            <span className="text-blue-600">Room Booking</span> Ecosystem
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Transform room booking operations into a data-driven marketing
            engine.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={scrollToWorkflow}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Explore the workflow
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Open live dashboard
            </Link>
          </div>
        </motion.div>

        {/* KPI cards */}
        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {KPIS.map((kpi, i) => (
            <Reveal key={kpi.label} delay={i * 0.07}>
              <div className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-slate-500">
                  <kpi.icon className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  <span className="text-xs font-medium">{kpi.label}</span>
                </div>
                <p className="mt-3 font-[family-name:var(--font-bricolage)] text-2xl font-bold tabular-nums text-slate-900">
                  <CountUp value={kpi.value} format={kpi.format} />
                </p>
                <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  {kpi.delta}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosedLoopArrow() {
  const reduced = useReducedMotion();
  return (
    <div className="mt-6 hidden lg:block" aria-hidden="true">
      <svg
        viewBox="0 0 1000 64"
        preserveAspectRatio="none"
        className="h-14 w-full"
        fill="none"
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
        Closed loop — retention data feeds the next acquisition campaign
      </p>
    </div>
  );
}

function WorkflowSection() {
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
        eyebrow="Customer journey"
        title="One journey, five phases, zero blind spots"
        blurb="Every phase captures data marketing can act on. Select a phase to see what happens in it — and what it records."
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
            <div key={phase.key} className="relative min-w-[230px] snap-start lg:min-w-0">
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
                    {phase.name}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    {phase.tagline}
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
              <h3 className="font-[family-name:var(--font-bricolage)] text-lg font-bold text-slate-900">
                {active.name}
              </h3>
              <p className="text-sm text-slate-500">{active.tagline}</p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.groups.map((group) => (
                <div
                  key={group.label}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {group.label}
                  </p>
                  {group.flow ? (
                    <ol className="mt-3 space-y-1.5">
                      {group.items.map((item, idx) => (
                        <li key={item} className="flex items-center gap-2">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${PHASE_STYLE[active.key].dot}`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-sm text-slate-700">{item}</span>
                          {idx < group.items.length - 1 && (
                            <ArrowDown
                              className="ml-auto h-3 w-3 text-slate-300"
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
                          key={item}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {item}
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

function CrmSection() {
  return (
    <section className="border-y border-slate-200 bg-slate-50/50">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          id="crm"
          eyebrow="CRM data model"
          title="One profile, filled by the whole journey"
          blurb="Every phase writes into the same customer record. The color of each field shows which phase captured it."
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
                    <th scope="col" className="px-5 py-2.5 font-semibold">
                      Field
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      Sample
                    </th>
                    <th scope="col" className="px-5 py-2.5 font-semibold">
                      Captured in
                    </th>
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

function EventsSection() {
  const reduced = useReducedMotion();
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        id="events"
        eyebrow="Event tracking architecture"
        title="13 events, four destinations"
        blurb="Every meaningful customer action fires a tracked event. The same stream powers ads, analytics, CRM, and the marketing dashboard."
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
                reduced
                  ? undefined
                  : { opacity: [0.25, 1, 0.25], x: [0, 6, 0] }
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
            <Reveal key={dest.name} delay={i * 0.08}>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <dest.icon className="h-4.5 w-4.5 text-blue-600" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {dest.name}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    {dest.note}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WidgetCard({
  title,
  phase,
  children,
  className,
}: {
  title: string;
  phase: PhaseKey;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
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
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-bricolage)] text-xl font-bold tabular-nums text-slate-900">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-emerald-700">{sub}</p>
    </div>
  );
}

function DashboardSection() {
  return (
    <section className="border-y border-slate-200 bg-slate-50/50">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          id="dashboard"
          eyebrow="Marketing dashboard"
          title="What marketing sees every morning"
          blurb="The closed loop ends in one screen: acquisition, conversion, retention, and operations — each widget tagged with the phase that feeds it."
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
          {/* Acquisition */}
          <Reveal className="xl:col-span-4">
            <WidgetCard title="Traffic Sources" phase="acquisition" className="h-full">
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
              title="Campaign Performance (bookings)"
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
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="campaign"
                      width={168}
                      tick={{ fontSize: 11, fill: "#475569", fontFamily: "var(--font-jetbrains-mono)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="bookings" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </WidgetCard>
          </Reveal>

          {/* Conversion */}
          <Reveal className="md:col-span-2 xl:col-span-7">
            <WidgetCard title="Conversion & Revenue" phase="purchase" className="h-full">
              <div className="grid grid-cols-3 gap-3">
                <StatBlock label="Booking Rate" value="2.7%" sub="+0.3pt" />
                <StatBlock label="Revenue" value="฿642K" sub="+15.2%" />
                <StatBlock label="ROAS" value="4.8x" sub="+0.6x" />
              </div>
              <div className="mt-4 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={REVENUE_TREND} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
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
            <WidgetCard title="Retention Health" phase="retention" className="h-full">
              <div className="grid grid-cols-3 gap-3">
                <StatBlock label="Repeat Rate" value="38%" sub="+5pt" />
                <StatBlock label="CLV" value="฿4,120" sub="+9.4%" />
                <StatBlock label="NPS" value="42" sub="+6" />
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500">
                  NPS response mix
                </p>
                <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full" role="img" aria-label="NPS mix: 56% promoters, 30% passives, 14% detractors">
                  <div className="bg-emerald-500" style={{ width: "56%" }} />
                  <div className="bg-slate-300" style={{ width: "30%" }} />
                  <div className="bg-rose-400" style={{ width: "14%" }} />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>Promoters 56%</span>
                  <span>Passives 30%</span>
                  <span>Detractors 14%</span>
                </div>
                <p className="mt-4 rounded-lg border border-rose-100 bg-rose-50/60 p-3 text-xs leading-relaxed text-slate-600">
                  <span className="font-semibold text-rose-700">
                    Automation firing now:
                  </span>{" "}
                  Exam Season Promotion → Students segment, Corporate Rebooking →
                  lapsed Corporate accounts, Happy Hour → off-peak regulars.
                </p>
              </div>
            </WidgetCard>
          </Reveal>

          {/* Operations */}
          <Reveal className="xl:col-span-7">
            <WidgetCard title="Most Popular Room" phase="service" className="h-full">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={POPULAR_ROOMS} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="room" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </WidgetCard>
          </Reveal>

          <Reveal delay={0.06} className="xl:col-span-5">
            <WidgetCard title="Peak Booking Hours" phase="service" className="h-full">
              <div className="flex h-40 items-end gap-1" role="img" aria-label="Peak booking hours: demand builds through the afternoon and peaks at 18:00">
                {PEAK_HOURS.map((slot) => (
                  <div key={slot.hour} className="flex flex-1 flex-col items-center gap-1">
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
                <Clock className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                Demand peaks 17:00–19:00 — Happy Hour promo targets 13:00–16:00.
              </p>
            </WidgetCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function GoalsFooter() {
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="rounded-2xl bg-blue-600 px-6 py-10 sm:px-10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-md">
                <h2 className="font-[family-name:var(--font-bricolage)] text-2xl font-bold text-white">
                  Key goals for marketing users
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-blue-100">
                  The loop exists to move four numbers. Everything on this page
                  feeds one of them.
                </p>
              </div>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {GOALS.map((goal) => (
                  <li key={goal} className="flex items-start gap-2 text-sm text-white">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-blue-200"
                      aria-hidden="true"
                    />
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <p>
            Smart Space — Marketing OS · demo visualization with mock data
          </p>
          <p className="flex items-center gap-1.5">
            <BadgePercent className="h-3.5 w-3.5" aria-hidden="true" />
            Acquisition → Conversion → Purchase → Service → Retention →{" "}
            <span className="text-rose-500">back to Acquisition</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   Page
   ============================================================ */

export default function MartechWorkflow() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-inter)] text-slate-900 antialiased">
      <TopNav />
      <Hero />
      <WorkflowSection />
      <CrmSection />
      <EventsSection />
      <DashboardSection />
      <GoalsFooter />
    </div>
  );
}
