"use client";

/**
 * "Marketing User" — Customer Data Platform (CDP) dashboard prototype for
 * Smart Space (20 rented rooms + in-room QR beverage upsell, unified by
 * LINE UID). Built against `BookingWeb/BriefMartech/Proposal_V2.docx`: one
 * Main KPI (Total Sales Growth ≥ +15% in 6 months), a 4-page drill-down
 * (Executive Overview → Space & Revenue → Customer & Loyalty → Beverage &
 * Campaign), 6 analytics techniques (K-Means, Apriori, Time-Series,
 * Multiple Regression, RFM, Recommendation), and a Human-in-the-loop
 * Approval Drawer gating every marketer action before it goes live. Thai-
 * only UI; technical vocabulary (AOV, Churn, KPI, Lift, RFM) stays English.
 * Warm light enterprise surface (own `cdp-*` token layer in ./theme.css) —
 * deliberately NOT the main app's dark-glass theme. `MotionConfig
 * reducedMotion="user"` wraps the whole shell so every framer-motion
 * animation in this route (page transitions, stagger, drawer, nav
 * indicator) collapses automatically when the OS reduce-motion setting is
 * on — one place instead of a per-component `useReducedMotion()` check.
 *
 * This file is the shell only: sidebar navigation + the shared reducer +
 * the Approval Drawer. Each page's content lives in ./pages; the domain
 * model, seeded history, metrics/analytics engines live in ./lib.
 *
 * All mock history is generated with a seeded PRNG at module scope so the
 * server prerender and client hydration always agree. Dates are stored as
 * relative day offsets ("X วันก่อน") — no absolute clock reads in render.
 */

import Link from "next/link";
import { useMemo, useReducer, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import {
  Banknote,
  Bell,
  Coffee,
  GlassWater,
  LayoutDashboard,
  MonitorSmartphone,
  Radio,
  ThermometerSun,
  Users,
} from "lucide-react";

import { regressionForecast } from "./lib/analytics-v2";
import { computeMetrics, INITIAL_STATE_FOR_BASELINE } from "./lib/metrics";
import { appReducer } from "./lib/reducer";
import { ApprovalDrawer } from "./components/approval-drawer";
import { Simulator } from "./components/simulator";
import { BeverageCampaign } from "./pages/beverage-campaign";
import { CustomerLoyalty } from "./pages/customer-loyalty";
import { ExecutiveOverview } from "./pages/executive-overview";
import { LiveOps } from "./pages/live-ops";
import { SpaceRevenue } from "./pages/space-revenue";

type View = "exec" | "space" | "customer" | "beverage" | "live" | "sim";

const NAV: Array<{ id: View; label: string; icon: React.ReactNode }> = [
  { id: "exec", label: "ภาพรวมผู้บริหาร", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "space", label: "พื้นที่และรายได้", icon: <ThermometerSun className="h-4 w-4" /> },
  { id: "customer", label: "ลูกค้าและความภักดี", icon: <Users className="h-4 w-4" /> },
  { id: "beverage", label: "เครื่องดื่มและแคมเปญ", icon: <Coffee className="h-4 w-4" /> },
  { id: "live", label: "ข้อมูลจริงจากแอป", icon: <Radio className="h-4 w-4" /> },
];

const ALL_ITEMS: Array<{ id: View; label: string; icon: React.ReactNode }> = [
  ...NAV,
  { id: "sim", label: "จำลองการจอง", icon: <MonitorSmartphone className="h-4 w-4" /> },
];

export default function MarketingUser({ fontClass }: { fontClass: string }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE_FOR_BASELINE);
  const [view, setView] = useState<View>("exec");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const m = useMemo(() => computeMetrics(state), [state]);
  const reg = useMemo(() => regressionForecast(state), [state]);
  const pendingCount = state.proposals.filter((p) => p.status === "pending").length;

  return (
    <MotionConfig reducedMotion="user">
    <div
      className={`${fontClass} flex h-screen flex-col bg-cdp-bg text-cdp-ink md:flex-row`}
      style={{ fontFamily: "var(--font-inter), var(--font-anuphan), sans-serif" }}
    >
      <Toaster richColors position="top-center" />
      <ApprovalDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} state={state} dispatch={dispatch} />

      {/* Left sidebar — desktop only, stays fixed while the content column scrolls;
          mobile keeps a horizontal pill nav below the top bar instead */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-cdp-border bg-cdp-surface md:flex">
        <Link href="/" className="flex items-center gap-2.5 border-b border-cdp-border px-5 py-4" aria-label="กลับหน้าแรก Smart Space">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cdp-accent text-cdp-on-accent">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div>
            <p
              className="text-sm font-bold leading-tight text-cdp-ink"
              style={{ fontFamily: "var(--font-bricolage), var(--font-anuphan), sans-serif" }}
            >
              Marketing User
            </p>
            <p className="text-[10px] leading-tight text-cdp-ink3">Smart Space CDP</p>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 p-3 text-sm font-semibold">
          {ALL_ITEMS.map((item, idx) => (
            <div key={item.id}>
              {idx === NAV.length ? <div className="my-2 h-px bg-cdp-border" /> : null}
              <button
                type="button"
                onClick={() => setView(item.id)}
                className={`relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                  view === item.id ? "text-cdp-on-accent" : "text-cdp-ink2 hover:bg-cdp-surface-2"
                }`}
              >
                {view === item.id ? (
                  <motion.span
                    layoutId="cdp-nav-active"
                    className="absolute inset-0 rounded-lg bg-cdp-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                ) : null}
                <span className="relative flex items-center gap-2.5">
                  {item.icon}
                  {item.label}
                </span>
              </button>
            </div>
          ))}
        </nav>

        <p className="border-t border-cdp-border px-5 py-3 text-[10px] leading-tight text-cdp-ink3">
          20 ห้อง · เชื่อมทุกธุรกรรมด้วย LINE UID
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-cdp-border bg-cdp-surface/90 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 md:hidden" aria-label="กลับหน้าแรก Smart Space">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cdp-accent text-cdp-on-accent">
                <LayoutDashboard className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm font-bold text-cdp-ink" style={{ fontFamily: "var(--font-bricolage), var(--font-anuphan), sans-serif" }}>
                Marketing User
              </p>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <div
                className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold sm:flex ${
                  reg.gapPts <= 0
                    ? "border-cdp-good/30 bg-cdp-good-soft text-cdp-good"
                    : "border-cdp-border bg-cdp-surface-2 text-cdp-ink2"
                }`}
              >
                <Banknote className="h-3.5 w-3.5" />
                Total Sales {reg.actualGrowthPct >= 0 ? "+" : ""}
                {reg.actualGrowthPct.toFixed(1)}%
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="relative flex items-center gap-1.5 rounded-full border border-cdp-border bg-cdp-surface px-3 py-1.5 text-xs font-semibold text-cdp-ink2 shadow-[var(--cdp-shadow-card)] hover:bg-cdp-surface-2"
              >
                <Bell className="h-3.5 w-3.5" />
                รออนุมัติ
                {pendingCount > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cdp-bad px-1 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          {/* Mobile section nav — sidebar takes over at md */}
          <div className="flex gap-1 overflow-x-auto px-4 pb-2 text-xs font-semibold md:hidden">
            {ALL_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                  view === item.id
                    ? "bg-cdp-accent text-cdp-on-accent shadow-sm"
                    : "bg-cdp-surface-2 text-cdp-ink2 hover:bg-cdp-border"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {view === "exec" ? (
                <ExecutiveOverview state={state} m={m} onNavigate={setView} />
              ) : view === "space" ? (
                <SpaceRevenue state={state} m={m} dispatch={dispatch} />
              ) : view === "customer" ? (
                <CustomerLoyalty state={state} m={m} dispatch={dispatch} />
              ) : view === "beverage" ? (
                <BeverageCampaign state={state} m={m} dispatch={dispatch} />
              ) : view === "live" ? (
                <LiveOps />
              ) : (
                <Simulator state={state} dispatch={dispatch} onGoDashboard={() => setView("exec")} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="border-t border-cdp-border bg-cdp-surface">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-[10px] text-cdp-ink3">
            <p>
              Smart Space CDP Prototype — Ingestion 5 จุด (LINE OA · Web Booking · In-Room QR · Payment/POS · CSAT) →
              Regression · K-Means · Apriori · Time-Series · RFM · Recommendation → Human-in-the-loop Activation
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
    </div>
    </MotionConfig>
  );
}
