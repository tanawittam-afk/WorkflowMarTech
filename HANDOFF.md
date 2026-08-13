# BookingWeb — HANDOFF

_Last updated: 2026-08-13 (redesigned the CDP Dashboard — left sidebar, warm token layer, decluttered Beverage page, harmonized Live Ops, subtle animation — build/lint/typecheck clean, CDP-verified)_

## ✅ Redesigned `/marketing-user` CDP Dashboard (2026-08-13, third pass today)

Owner asked for the CDP Dashboard to read more easily, move its top-tab nav to a left sidebar, warm up the color tone, and add subtle animation — plus a separate later ask (not yet actioned) to onboard `DavidHDev/react-bits` as a team skill. Plan: `C:\Users\User\.claude\plans\bookingweb-snoopy-wadler.md`.

**Owner decisions (locked):** (1) redesign now, react-bits onboarding is a separate future step under the repo's formal per-skill governance pipeline (that pipeline currently only exists on branch `job-tracker-phase7-redesign`, not here); (2) react-bits scope for that later step: its 4 markdown-only Skills plus hand-picked framer-motion-only components (skip the gsap/three/ogl-dependent ones); (3) warm light palette with one clear accent, not another dark mode; (4) readability priorities in order: build the token layer first, declutter Beverage & Campaign, bump spacing/type, harmonize Live Ops into the main theme.

**Changes:**
- **Token layer** — `cdp-*` design tokens (bg/surface/border/ink/accent/good/warn/bad) added to `app/globals.css` (NOT a separate imported stylesheet — see gotcha below), warm neutral background + indigo `#4f46e5` accent, replacing the route's literal `slate-*`/`blue-600` Tailwind classes across every file in `app/marketing-user/**`
- **Left sidebar** — `marketing-user.tsx`'s two stacked top-header rows became a fixed-width `<aside>` (desktop) with a framer-motion `layoutId` active-indicator that slides between items; mobile keeps the old horizontal pill row (`md:hidden`). The whole shell is now `h-screen` with the sidebar fixed and only the content column (`overflow-y-auto`) scrolling — needed a second fix after the first cut let the sidebar scroll away with long pages
- **Typography/spacing** — bumped via `primitives.tsx` (`Card`, `SectionHeader`) and `kpi-tile.tsx` so it cascades to every page from one place
- **Declutter Beverage & Campaign** (`pages/beverage-campaign.tsx`) — added an in-page segmented control splitting "Association & Recommendations" vs. "Active Bundles," roughly halving the page's stacked-block count
- **Harmonized Live Ops** — new `app/marketing-user/components/live/*` (occupancy heatmap, zone pie, conversion chart, sentiment summary) + `components/metric-card.tsx`, light-themed twins of `components/dashboard/*` reading the same real `useBookingStore` data. `components/dashboard/*` themselves untouched — still used by the real app's dark-theme pages
- **Animation polish** — `MotionConfig reducedMotion="user"` wraps the whole shell (one place instead of per-component `useReducedMotion()` checks); new `components/stagger-grid.tsx` gives every page's KPI-tile row a staggered entrance
- Deleted two dead legacy files found during the sweep: `components/goal-bars.tsx`, `components/kpi-grid.tsx` (leftover from the pre-split single-file version, not imported anywhere)

### Gotcha hit this session
**Tailwind v4 `@theme` blocks only generate utility classes when they live in the same build graph as the file with `@import "tailwindcss"`.** First attempt put the `cdp-*` tokens in a separate `app/marketing-user/theme.css`, imported directly from `page.tsx` — it compiled with no errors, but every `bg-cdp-*`/`text-cdp-*`/`border-cdp-*` class silently resolved to `rgba(0,0,0,0)` (verified via computed-style JS in the browser — an invisible bug that LOOKED like it was working in a screenshot because transparent backgrounds on a white page + a stray dark border color read as "fine" at a glance). Fixed by moving every token straight into `app/globals.css`, following the exact pattern the app's own existing dark-glass tokens already use (`:root` variables → one `@theme inline {}` block). If a future route wants its own scoped token set, put it in `globals.css`, not a separate file.

### Verified
`npm run lint` clean · `npx tsc --noEmit` clean · `npm run build` passes, 14 routes. CDP-driven click-through: sidebar active-indicator slides correctly between all 6 nav items; Beverage & Campaign segmented control toggles; Live Ops renders fully warm-themed (no more dark-glass insert) with real data; sidebar stays fixed while scrolling a long page (verified after the h-screen fix); CDP hero numbers unchanged (+8.2%/+10.0%) confirming the mock engine wasn't touched.

---

## ✅ Retired `/dashboard`, merged into `/marketing-user` (2026-08-13, same day, later pass)

Follow-up to the pass below: owner asked whether the "Operations Dashboard" (`/dashboard`, real live data) was still pulling its weight given every CDP marketing *action* already requires clicking through the "รออนุมัติ" approval drawer. Investigated and confirmed real visual overlap (both had an occupancy heatmap, both showed customer/CSAT-shaped metrics) despite different data sources (`/dashboard` = real zustand store; `/marketing-user` = seeded mock engine calibrated to Proposal_V2's worked example, +8.2% actual → +10% forecast).

**Owner decisions (locked):** (1) delete `/dashboard` entirely; (2) its unique value — real live-app data — moves into a new **"ข้อมูลจริงจากแอป" (Live Ops)** page inside `/marketing-user`, a 6th nav item alongside the 4 CDP pages + Simulator; (3) the CDP's core analytics (`lib/analytics-v2.ts`, `lib/scenarios.ts`, `lib/domain.ts`, `lib/history.ts` — the calibrated regression) are **untouched**, only Live Ops reads the real store; (4) `/marketing-user` now requires the Marketing Staff login (same gate `/dashboard` used to have), since it shows real customer/booking data.

**Changes:**
- New `app/marketing-user/pages/live-ops.tsx` — reads the real `useBookingStore` (customers/bookings/zones/rooms/reviews/notifications/orders), reuses `computeDashboardMetrics` from `@/lib/analytics/dashboard-metrics` and the `components/dashboard/*` widgets (`MetricCard`, `OccupancyHeatmap`, `ZonePieChart`, `ConversionLineChart`, `SentimentTopicSummary`) **as-is, unskinned** — their dark-glass tokens read visually distinct from the CDP shell's light blue/white cards, deliberately signaling "this section is live, not simulated," same idea as the Simulator tab's context switch
- `app/marketing-user/marketing-user.tsx` — `View` union gained `"live"`; `NAV` gained a 6th entry wired to `<LiveOps />`
- `app/marketing-user/page.tsx` — wrapped `<MarketingUser>` in `<RoleGuard requiredRole="marketing">` (reused from `@/components/layout/role-guard`, the same guard `(marketing)/layout.tsx` uses — **not** the full layout with `MarketingSidebar`, since `/marketing-user` keeps its own custom top-nav shell)
- Deleted `app/(marketing)/dashboard/` entirely (route now 404s)
- `components/layout/marketing-sidebar.tsx` — removed the old `/dashboard` entry; renamed the `/marketing-user` entry from "CDP Dashboard" to "Dashboard" (now the only one)
- `app/(auth)/login/login-form.tsx` — Marketing Staff sign-in now `router.push("/marketing-user")` (was `/dashboard`); blurb copy updated
- `app/martech/martech-workflow.tsx` — hero secondary CTA (`HERO.ctaSecondary`, "Open live dashboard") now links to `/marketing-user`

### Verified
`npm run lint` clean · `npx tsc --noEmit` clean (after a clean `.next` rebuild — stale generated route types referenced the deleted page) · `npm run build` passes, **14 routes** (was 15). CDP-driven: clearing the session and visiting `/marketing-user` redirects to `/login`; signing in as Marketing Staff lands on `/marketing-user` directly; the new Live Ops tab renders real data (Total Customers, CSAT, occupancy heatmap, LINE OA conversion, sentiment/topic cloud) distinct in style from the CDP pages; sidebar's single "Dashboard" entry navigates correctly from `/analytics`; `/dashboard` 404s; CDP hero numbers unchanged (+8.2% actual / 10.0% forecast) confirming the mock engine/calibration was not touched.

---

## ✅ Resolved duplicate Marketing Dashboards + adopted new BriefMartech PDFs (2026-08-13)

Owner asked why there were two look-alike "Marketing Dashboard" surfaces in the app (landing page put `/martech` and `/marketing-user` side by side). Investigation found **three** surfaces total, never merged: `(marketing)/dashboard` (real zustand data, topbar said "Marketing Tech Dashboard"), `/marketing-user` (CDP prototype, mock engine), `/martech` (illustrative workflow story). Two new files landed in `BriefMartech/`: `Project_Progress_Report_Group 4.pdf` and `Smart Living Spaces.pdf` — both confirm/extend Proposal_V2 and add two concepts not yet in the app (8-dimension Marketing Questions table §1.2; 4-level Data Analytics ladder Descriptive→Diagnostic→Predictive→Prescriptive §6.3–6.4). Plan: `C:\Users\User\.claude\plans\bookingweb-snoopy-wadler.md`.

**Owner decisions (locked):** (1) `/marketing-user` is the one real CDP Dashboard going forward; (2) `(marketing)/dashboard` becomes an **Operations Dashboard** — real booking/space/customer data only, CDP-forecast/marketing-action widgets removed (they duplicated `/marketing-user`, worse); (3) `/martech` gets a content-only refresh (arrays, not rendering/animation) to the new PDFs, same pattern as the 2026-07-20 realignment below; (4) `/marketing-user` gets the two new PDF concepts added, numbers still 100% live-computed (no hardcoding); (5) sidebar gets a new entry so the CDP Dashboard is reachable from inside the app, not just the landing page.

**Route ownership after this pass:**
| Route | Role | Data |
|---|---|---|
| `/dashboard` | Operations Dashboard — space/customer ops, links out to CDP Dashboard for forecasts | real zustand |
| `/marketing-user` | **The** CDP Dashboard — Main KPI, forecast, RFM, bundling, recommendations | seeded mock engine |
| `/martech` | Workflow story / pitch page — how the CDP pipeline works end to end | illustrative |

**Changes:**
- `components/layout/marketing-sidebar.tsx` — added `{ href: "/marketing-user", label: "CDP Dashboard" }` to `NAV_ITEMS`
- `app/(marketing)/dashboard/page.tsx` — retitled "Operations Dashboard"; removed `GoalProgressRow`, `ChurnWinbackTable`, `BundlingPanel`, `BeverageBarChart` (CDP-duplicate widgets, files deleted, no other importers); trimmed KPI grid to 5 ops metrics; added a callout `Card` linking to `/marketing-user`; kept `OccupancyHeatmap`, `ZonePieChart`, `ConversionLineChart`, `SentimentTopicSummary` (real operational data)
- `app/page.tsx` — landing copy under "Marketing OS" now explicitly names both surfaces (workflow story vs. live dashboard) instead of reading as one duplicated offer
- `app/(auth)/login/login-form.tsx` — "Marketing Tech Dashboard" → "Operations Dashboard" in the sign-in copy, for consistency
- `app/martech/martech-workflow.tsx` — content-only edits to `KPIS`, `PHASES` (Data Ingestion 3→5 touchpoints, Advanced Analytics 3→6 techniques adding Multiple Regression/RFM/Recommendation, Measure & Close the Loop reframed to the single Main KPI), `CRM_FIELDS` (+`fact_payments`, +`fact_csat`), `GOALS`, `CRM_HEADING`, `HERO`, `WORKFLOW_HEADING`, `GOALS_FOOTER`, `DESTINATIONS` — all per the new PDFs. Untouched: `PhaseKey` union naming, Framer Motion/layout code, the illustrative `TRAFFIC_SOURCES`/`CAMPAIGNS`/`REVENUE_TREND` mock-widget arrays (out of scope, purely illustrative)
- `app/marketing-user/` — three additions to Page 1 (`pages/executive-overview.tsx`), all presentational over already-computed state, no changes to `lib/domain.ts`/`lib/history.ts`/`lib/metrics.ts`/`lib/analytics-v2.ts`:
  - `components/analytics-ladder.tsx` (new) — the Descriptive→Diagnostic→Predictive→Prescriptive ladder made explicit, re-labeling `reg`/`scenario` values already shown elsewhere on the page
  - `lib/marketing-questions.ts` + `components/marketing-questions-panel.tsx` (new) — the 8-dimension Marketing Questions table (4P + CX/Loyalty/Revenue), collapsed by default, each row deep-links via `onNavigate`
  - `components/data-sources-strip.tsx` (new) — upgraded the one-line footer caption into a 5-icon Data Source strip (LINE OA/Web Booking/In-Room QR/Payment-POS/CSAT)
  - `ExecutiveOverview`'s `onNavigate` prop widened to include `"exec"` (was `"space"|"customer"|"beverage"` only) so the Questions panel can link back to Page 1 itself

### Verified
`npm run lint` clean · `npx tsc --noEmit` clean · `npm run build` passes, 15 routes. CDP-driven click-through: `/`, `/dashboard`, `/martech`, `/marketing-user` all load; sidebar's "CDP Dashboard" and the dashboard's "Open CDP Dashboard" callout both land on `/marketing-user`; Marketing Questions panel expands and its deep-links navigate correctly (verified Product → Beverage & Campaign page). **Not verified:** true 390px device-emulation pixel check — `resize_window` on this Windows/headless setup doesn't actually change the render viewport (same root cause as the gotcha below, just via the MCP tool this time, not the CLI screenshot flag); the three new components use only grid/flex-wrap/text (no `recharts`/fixed-width elements, the actual source of that gotcha), so they're structurally low-risk, but a real device-metrics-override check is still outstanding before this is called done for mobile.

## ✅ `/marketing-user` rebuilt for Proposal_V2 (2026-08-12)

`BookingWeb/BriefMartech/Proposal_V2.docx` (docx modified 2026-08-11) replaced the V1 proposal `/marketing-user` was originally built from. V2 changes the shape of the dashboard, not just its wording, so the **prior lock — "`/marketing-user` stays architecturally untouched" (2026-07-20, line below) is now superseded for this route.** `(marketing)/dashboard` is unaffected and still the real-zustand closed-loop proof; this phase only touched `/marketing-user`.

**What V2 required that V1 didn't:**
- One Main KPI — **Total Sales Growth (Room + Beverage) ≥ +15% in 6 months** — instead of 8 equal-weight KPI cards
- A **4-page drill-down** (Executive Overview → Space & Revenue → Customer & Loyalty → Beverage & Campaign) instead of one scrolling page
- 3 new analytics techniques: **Multiple Regression** (Sales Forecast/Gap/Factor Contribution), standalone **RFM tiering** (VIP/Loyal/Potential/At-Risk), and a **Recommendation System** — on top of the existing K-Means/Apriori/Time-Series
- A **Business Scenario A–E** playbook (resolves from live numbers, drives the Page 1 verdict banner)
- **Human-in-the-loop**: every marketer action (coupon, bundle, dynamic pricing) now proposes → waits for approval → only then fires, via a new Approval Drawer + Impact Tracker

**User decisions (locked for this phase):** (1) rebuild `/marketing-user` itself, keep Simulator as a 5th nav item, same route; (2) single page per audience — no role switcher, Page 1 is the 10-second read, Pages 2–4 are the marketer's drill-down; (3) numbers computed live from mock data, **calibrated** so the headline matches the Proposal_V2 worked example (actual ≈ +8.2%, forecast ≈ +10%, gap ≈ 5pts) rather than hardcoded; (4) Approval Drawer with Pending → Approved + a live Impact Tracker; (5) Clean-BI look (Looker/Power BI-style) with a 3-line Insight Strip (read → meaning → action) under every chart/table — this is where Descriptive→Diagnostic→Predictive→Prescriptive shows up on screen, no framework label anywhere in the UI; (6) Thai-only, English technical vocabulary.

### File layout (was one 1,963-line file, now split)
```
app/marketing-user/
  page.tsx                    — unchanged (server wrapper + Anuphan font)
  marketing-user.tsx          — shell: sidebar nav (5 views) + reducer + Approval Drawer mount
  lib/domain.ts                — types, ROOMS/BEVERAGES/CUSTOMERS/BUNDLE_RULES, Proposal type
  lib/history.ts                — seeded PRNG + generateHistory() — UNCHANGED from V1, no distortion
  lib/metrics.ts                — computeMetrics() + BASELINES, extended with bookingCount30/avgRoomRevPerBooking30/offPeakShare30
  lib/reducer.ts                 — appReducer, now with propose/approveProposal/rejectProposal
  lib/analytics-v2.ts            — regressionForecast(), rfmTiers(), recommendFor() — the 3 new V2 techniques
  lib/insights.ts                — Insight Strip copy generators (read/meaning/action per section)
  lib/scenarios.ts               — Business Scenario A–E resolver
  components/*.tsx               — primitives, kpi-tile, insight-strip, approval-drawer, rfm-table,
                                    segment-scatter, forecast-chart, association-rules-table,
                                    recommendation-cards, + the V1 pieces moved as-is (occupancy-heatmap,
                                    service-charts, bundle-panel, event-log, simulator)
  pages/*.tsx                     — ExecutiveOverview, SpaceRevenue, CustomerLoyalty, BeverageCampaign
```

### The regression calibration — why it's not hardcoded
`lib/analytics-v2.ts`'s `regressionForecast()` fits a quadratic in calendar month through 3 checkpoints — launch (month 0, growth 0% by definition), month 3 (`MONTH_3_GROWTH_PCT = 4.9`, a fixed historical input, same pattern as `BASELINES` in `metrics.ts`), and **now** (computed live from `computeMetrics(state).roomRev30 + bevRev30` vs a fixed pre-CDP baseline derived from `M0`). Only the "now" point is live — approving proposals or booking through the Simulator moves it, and the whole forecast recomputes. `BASELINE_TOTAL_SALES_30D` is picked so the *initial* state reads exactly +8.2%, matching the Proposal_V2 example; the month-3 checkpoint was solved algebraically so the same fit lands the 12-month forecast at +10.0% (verified via a throwaway calibration script, not asserted — rerun by hand if `MONTH_3_GROWTH_PCT` or the baseline formula ever changes).

An earlier attempt tried to get this growth number by skewing per-booking revenue/counts across day-offset windows inside `generateHistory()` — abandoned: with only 15 seeded customers (~150 bookings), any window-count skew was swamped by seed noise, and a revenue multiplier large enough to compensate visibly distorted individual booking amounts elsewhere (heatmap tooltips, RFM monetary column). `lib/history.ts` is therefore **byte-for-byte the V1 generator** — no lift, no distortion. Keep it that way; do the growth-shaping in `analytics-v2.ts` only.

### Verified
`npm run build` / `npm run lint` / `npx tsc --noEmit` all clean. Dev server: `/marketing-user` and `/martech` and `/` return 200, SSR HTML shows `+8.2%` hero and `10.0%` forecast (no NaN). **Not click-tested** — no browser automation available this session (Claude-in-Chrome extension not connected). Before shipping, click through all 5 nav items at 390px and 1440px, confirm the `ResponsiveContainer` `min-w-0` gotcha (below) doesn't regress on the new `forecast-chart.tsx` / `segment-scatter.tsx`, and walk one full approve → Impact Tracker cycle plus one full Simulator booking to confirm the Page 1 hero number moves.

---

## ⏳ Presentation-ready pass (for class demo 2026-07-21)

Goal: make the demo survive a projector walkthrough **and** a room full of people opening it on their own phones. Plan: `C:\Users\User\.claude\plans\project-bookingweb-idempotent-forest.md`.

**User decisions (locked):** (1) demo-realistic only — real backend deferred to a later pass; (2) presenter drives the main flow AND a QR is shared for classmates; (3) `/marketing-user` stays architecturally untouched — `(marketing)/dashboard` (real zustand) is the closed-loop proof; (4) `/martech` text-only fixes, never its data model.

### Biggest find — mobile marketing section was a dead end
`MarketingSidebar` is `md:flex` only, and the `MarketingTopbar` hamburger had **no `onClick`** — a phone user landing on `/dashboard` could not reach `/analytics`, `/customers`, `/bookings`, or log out without typing URLs. This was not in the original plan and outranked the planned Tier-3 polish.

### Changes
- `components/layout/marketing-mobile-nav.tsx` **(new)** — Radix-Dialog drawer reusing `NAV_ITEMS`; wired into `marketing-topbar.tsx` in place of the dead button
- `components/layout/reset-demo-button.tsx` **(new)** — confirm-gated demo reset; mounted in both the desktop sidebar footer and the mobile drawer
- `lib/store/booking-store.ts` — new `resetDemo()`; **also rewinds the module-level `nextCustomerSeq`/`nextBookingSeq`/`nextOrderSeq`**, otherwise post-reset IDs resume from the old run. Keeps the session (no logout mid-demo)
- `components/layout/marketing-sidebar.tsx` — `NAV_ITEMS` now exported (shared with the drawer)
- `app/page.tsx` — added the missing entry point to `/marketing-user`; landing now reaches all three surfaces
- `app/marketing-user/marketing-user.tsx` — header logo is a `Link href="/"` (was a dead end). Nav only; data engine untouched
- `qr-smart-space.svg` **(new)** — 1024px level-H QR of the prod URL for the slide deck. Regenerate with `qrcode.react` + `renderToStaticMarkup`; delete freely, it is a deliverable not a dependency

### Verified
`npm run lint` clean · `npm run build` passes, 15 routes · dev server returns 200 on `/`, `/martech`, `/marketing-user`, `/login`, `/dashboard`, `/book` · landing HTML now emits all three hrefs · `/marketing-user` emits the home link.

### NOT verified — do this first
No browser automation is installed in this repo, so **interactive behaviour was never click-tested**: (a) mobile drawer opens/closes and navigates at 390px; (b) Reset demo confirm → data actually returns to seed state and the dashboard re-renders; (c) every `/dashboard` recharts row at 390px (recharts measures max-content silently when an ancestor lacks `min-w-0`).

### /martech realigned to MarketTech.md — DONE 2026-07-20
`/martech` was built 2026-07-10 from `Project (Proposal).md`, **before** `MarketTech.md` (2026-07-15), and the retrofit deliberately skipped it. A grep proved the gap: it named none of the brief's analytics core — no K-Means, Apriori, Time-Series, CSAT, AOV, attach rate or churn, only one stray "Dynamic Pricing". It told a generic acquisition→ROAS funnel story instead, so the three surfaces read as unrelated projects.

**Key insight that made this safe the night before a demo:** the page is fully data-driven — `PHASES`, `KPIS`, `CRM_FIELDS`, `EVENT_GROUPS`, `DESTINATIONS`, `GOALS` are plain arrays the renderer consumes. Content was rewritten; **no rendering, animation, or bilingual machinery was touched.**

The 5 phases now mirror the brief's pipeline: Data Ingestion (3 touchpoints) → ETL → Advanced Analytics (the 3 models, with real in/out and `Lift > 2.5`) → Data Activation (2 automated actions) → Measure & Close the Loop (the 3 objectives). The `PhaseKey` union still reads `acquisition|conversion|purchase|service|retention` — deliberately left alone, since those identifiers also appear in six render sites and are invisible to a viewer. Rename them in a calmer session.

Also realigned: CRM table → the three real tables plus ETL/model-derived fields; events 13 → 18; destinations GA4/Meta Pixel → LINE OA/Booking Site/CDP/Dashboard; ROAS → Attach Rate; NPS → CSAT (brief uses CSAT); hero, workflow heading, footer breadcrumb and goals footer copy.

Verified: lint clean, build passes, `/martech` 200, all brief terms present (bundle-grepped for the ones behind the phase-click interaction), and zero leftovers of ROAS / NPS / Promoters / Happy Hour / Meta Pixel.

### Identity & verification — decision recorded, NOT built
Owner asked whether identity should rest on LINE UID alone, or also phone / email. Findings from the code:

- `lib/data/types.ts` already stores `phoneNumber`, `email`, **and** `lineUid`, and the real primary key is `customerId` ("C001") — `lineUid` is only *displayed* as the unifying Customer ID. **The architecture is not LINE-locked; the UI just presents it that way.**
- `app/(auth)/register/page.tsx` already collects phone and email.
- `registerCustomer` in `lib/store/booking-store.ts` **mints `lineUid` from a running sequence** (`U` + hex) — it is not a real LINE login.
- **There is no identity-verification step anywhere** — no OTP, no confirm. Register submits straight through.

The framing that resolves it: `MarketTech.md` specifies LINE UID as the **join key** across the three ingestion touchpoints — a data-architecture choice. **Verification method is a separate concern the brief never addresses.** Phone/email verification can coexist with a LINE UID join key; both resolve to the same `customerId`.

Decision for the 2026-07-21 demo: **talking points only, no code.** Deliberately not built — no `verifiedVia`/`verifiedAt` fields, no OTP screen, no verification badge in `/customers`. When presenting, say the model *supports* multiple identifiers; do **not** claim a working verification flow, because there is no screen to show.

If built later (model is ready, so this is additive): add `verifiedVia: "phone" | "email" | "line"` + `verifiedAt` to `Customer`, a mock OTP step after register, and a verification badge in `(marketing)/customers`. Production default would be phone OTP with LINE linked afterwards for coupon delivery; coupons fall back to SMS/email when LINE is absent.

### Deploy — DONE 2026-07-20
`vercel --prod` shipped `dpl_23MQu1kGZcsa2T5Dy2HzCiGuqzi7`, aliased to https://bookingweb-smart-space.vercel.app. This closed the 2026-07-15 gap (the retrofit CDP dashboard is finally live) and carried the presentation pass with it. Verified unauthenticated: `/`, `/martech`, `/marketing-user`, `/dashboard` all 200 — **no Vercel deployment protection**, so the shared QR reaches the app rather than a Vercel login wall. Landing HTML emits all three hrefs on prod.

---

_Previous update: 2026-07-15 (evening — retrofit complete, ready to deploy)_

## ✅ Retrofit main app per new BriefMarTech — DONE (all 5 phases)

Merged the new brief's CDP features into the ORIGINAL dark-glass app (real zustand data), keeping `/marketing-user` and `/martech` untouched. Approved plan: `C:\Users\User\.claude\plans\partitioned-swinging-teapot.md`.

**User decisions (locked):** (1) rooms rebuilt per brief: 20 rooms, 3 sizes — Small ฿300/hr cap 5 (desk+WiFi), Medium ฿500/hr cap 10 (+writable Smart TV), Large ฿1000/hr cap 15-20 (+mics & speakers); (2) full customer in-room QR beverage flow; (3) CDP widgets melt into the existing `(marketing)/dashboard`; (4) keep `/marketing-user` as-is; (5) UI English, beverage menu names Thai (Anuphan fallback font).

### Phase 1 — Data model + store
- `lib/data/types.ts` — `ZoneId` = `zone-small|zone-medium|zone-large`; `Customer.lineUid`; new `Beverage`, `OrderLine`, `BeverageOrder`, `BundleRule`
- `lib/data/mock-data.ts` — 3 size-zones + 20 rooms, `BEVERAGES` (8, Thai names), `BUNDLE_RULES` (3), seeded generator (mulberry32) for ~80 bookings + `BEVERAGE_ORDERS`, churn seeds C005/C008/C013/C017, `BASELINES` for goal bars
- `lib/store/booking-store.ts` — `orders/dynamicPricing/activeBundles/winBackSent` state + `addOrder/toggleDynamicPricing/toggleBundle/sendWinBackCoupon` actions; **persist `version: 2` + migrate discards pre-v2 snapshots**
- `lib/booking-helpers.ts` — `OFF_PEAK_HOURS` = {9,10,11,21}, `OFF_PEAK_DISCOUNT` 0.18, `rateForHour`, `priceForSlot`
- Zone rename sweep: `globals.css` tokens, `badge.tsx` variants, `zone-availability-grid.tsx` icons, `zone-pie-chart.tsx`, `loyalty-stamp-card.tsx`, cluster chart files

### Phase 2 — Customer flows
- `room-slot-picker.tsx` — off-peak pricing shown in hour dropdown + struck-through full price
- `book/confirm/confirm-form.tsx` — auto-applies win-back coupon (−15%), Smart-Bundle Dialog when an active rule matches zone+hour
- `components/qr/in-room-order-panel.tsx` + `components/qr/checkout-summary.tsx` — round1+round2 bill + **CSAT stars → `submitCsat`** (closed the old no-UI gap); wired into `qr/[bookingId]/page.tsx`
- `account/page.tsx` — shows LINE UID instead of internal customerId

### Phase 3 — Marketing CDP dashboard (`(marketing)/dashboard/page.tsx`, dark-glass)
- NEW `lib/analytics/dashboard-metrics.ts` — `computeDashboardMetrics` (revenue30/attachRate30/combinedAov30/occupancyRate/topBeverage/lineOaConversionRate) + `topBeveragesByQty`
- NEW `components/dashboard/goal-progress-row.tsx` — 3 SMART goal bars vs. `BASELINES`
- NEW `components/dashboard/occupancy-heatmap.tsx` — 20 rooms × 13 operating hours (09:00–21:00, matches actual bookable window), heat from real historical booking density, "booked today" ring overlay, Dynamic Pricing toggle wired to the store
- NEW `components/dashboard/beverage-bar-chart.tsx`, `bundling-panel.tsx` (BUNDLE_RULES activate toggle), `churn-winback-table.tsx` (`computeChurnRisks` + "Sync & Send" → `sendWinBackCoupon` + sonner toast)
- Dashboard now: goal row → 8 KPI cards (added Occupancy/Combined AOV/Top Service/LINE OA Conversion) → heatmap+pie → beverage chart+bundling → churn table → conversion+sentiment. Removed `OccupancyBarChart` (replaced by heatmap; file deleted).
- **Found + fixed 2 latent mobile-overflow bugs** while verifying at 390px (recharts blew past the viewport — same root cause as the `/marketing-user` bug from the prior phase, just never triggered until real width pressure was added here): `components/ui/card.tsx` and `app/(marketing)/layout.tsx`'s content wrapper both lacked `min-w-0` on their flex/grid item. Fixed both — this benefits every page using `Card` inside a grid/flex, not just the dashboard.

### Phase 4 — Ripple fixes
- Anuphan added to root `app/layout.tsx` (global, not route-scoped like `/marketing-user`) + `--font-sans`/`--font-heading`/body `font-family` fallback chains in `globals.css` — Thai beverage names now render correctly everywhere, not just on the CDP prototype route
- LINE UID column added to `(marketing)/customers` table (searchable too)
- Verified `lib/analytics/topics.ts` synonym map still has real signal against the rewritten reviews (confirmed live: pod/wifi/coffee-price/staff-service topics render on the dashboard)
- Grep sweep found and fixed stale zone-name copy: landing page `ZONES` showcase (`app/page.tsx`), root metadata description (`app/layout.tsx`), loyalty card title (`components/notifications/loyalty-stamp-card.tsx`) — all referenced old Studio/Coworking/Cafe zones. `app/martech/*` intentionally left untouched (illustrative workflow page, out of scope).
- Bonus fix while mobile-sweeping: `components/ui/tabs.tsx`'s `TabsList` had no overflow containment — `/analytics`'s 4-tab bar blew out the page at 390px (pre-existing bug, unrelated to this retrofit, but low-risk one-line fix so it shipped clean). Wrapped in `overflow-x-auto`.

### Phase 5 — Verify
- `npm run lint` clean, `npm run build` passes (15 routes)
- CDP dashboard smoke (scratchpad `cdp/dashboard-smoke.mjs`): 28/28 — content, heatmap 20 rows, dynamic pricing, churn coupon send + toast, bundle activate, no h-overflow @1440/@390
- CDP full e2e journey (scratchpad `cdp/e2e-smoke.mjs`): 29/30 — marketing activates dynamic pricing + bundle + sends win-back coupon → logs out → logs in as that (churned) customer → books zone-medium at the off-peak+bundle hour → win-back auto-applies, bundle pop-up accepted → check-in → orders 2 rounds of drinks → check-out → combined bill shown → CSAT submitted → account page shows it → logs back in as marketing → dashboard still renders, no regression on `/marketing-user` or `/martech` → mobile 390 clean on `/dashboard`, `/customers`, `/bookings`, `/analytics`. (The 1 "failure" is a rounding artifact in the test's own AOV-delta assertion, not a code defect — combined AOV is computed live from real store state and did move, just rounded back to the same displayed value.)
- Not yet done: production deploy — **user runs `vercel --prod`** themselves (agent is permission-blocked from production deploys).

### Gotchas hit this session
- Google-Fonts fetch during `next build` fails transiently (network) → build errors mentioning `font/google/*.woff2` module-not-found; just retry.
- localStorage from before this retrofit holds old zone ids → handled by persist v2 migrate (discards). If weird data appears, clear key `bookingweb-session`.
- Recharts `ResponsiveContainer` measures whatever width its nearest grid/flex ancestor computes — if ANY ancestor in that chain is missing `min-w-0`, it silently measures the unconstrained max-content width instead of the viewport, and the chart (plus its whole Card) blows past the page on narrow viewports with zero console error. Always CDP-check new dashboard rows at 390px, not just 1440.

## What this project is

**Smart Space** — a co-working / creator-hub booking demo (Next.js 16 App Router, React 19, Tailwind v4, shadcn-style UI, zustand + localStorage, 100% mock data, no backend). Three route groups: `(auth)` simulated login/register, `(customer)` book → QR check-in → notifications/loyalty, `(marketing)` dashboard + analytics (hand-written k-means, churn, sentiment, topics). The backend-swap seam is `lib/data/repo.ts` (`BookingRepo` interface — a future `supabaseRepo` drops in with zero component changes). Plus two standalone marketing showcase routes: `/martech` (workflow story page, bilingual) and `/marketing-user` (interactive CDP dashboard prototype, Thai-only).

## Latest phase (2026-07-15): `/marketing-user` — CDP dashboard "Marketing User" — SHIPPED ✅

Built from the new brief in `BriefMartech/MarketTech.md` + `BriefMartech/Project (Proposal).md`. Decision made: **new self-contained route inside this project** (not a rebuild, not a retrofit of the old `(marketing)` dashboard — its data model has no beverages/LINE UID/20-room grid).

**Route:** `/marketing-user` — Smart Space CDP prototype. Thai-only UI (technical terms stay English); light enterprise white/blue-600 surface matching `/martech`.

**Files (follows the /martech single-file pattern):**
- `app/marketing-user/page.tsx` — server wrapper (metadata + route-scoped Anuphan font)
- `app/marketing-user/marketing-user.tsx` — entire app in one `"use client"` file: seeded mock data engine (`dim_customers` 15 profiles keyed by LINE UID, 20 rooms S/M/L @300/500/1000, `fact_bookings` ~90 days, `fact_billings` QR beverage orders) → simulated analytics (K-Means personas + churn risk, Apriori bundle rules, time-series demand curves) → `useReducer` shared state.
- `app/martech/martech-workflow.tsx` — only change: TopNav link → `/marketing-user`.

**What's on the page:** 2 tabs (แดชบอร์ดนักการตลาด / จำลองการจองของลูกค้า) · 3 SMART goal progress bars (room revenue +15%, attach rate →40%, AOV +15% — baselines fixed at first render so bars move live) · 8 KPI cards · 20×24 occupancy heatmap + Dynamic Pricing toggle (off-peak 21:00–09:00 −18%) · pie/bar service+beverage charts (recharts) · VIP churn table (risk ≥80%) with per-row "Sync & Send คูปองเข้า LINE OA" → sonner toast · AI Smart Bundling cards (activate → simulator shows bundle pop-up) · Activity Log. Simulator walks the full journey (pick customer → book+pay round 1, coupon/dynamic-pricing discounts apply → in-room QR ordering with auto-trigger banner → checkout round 2 + CSAT) and every commit updates the dashboard. Closed loop verified: send coupon → book as that customer in simulator → churn row clears + LINE OA conversion ticks up.

**Verification done (2026-07-15):**
- `npm run lint` clean; `npm run build` passes (16 routes incl. `/marketing-user` static)
- CDP smoke script (scratchpad `cdp/smoke.mjs` pattern — ws + raw CDP): **37/37 checks pass** — content, heatmap 20 rows, dynamic-pricing banner, coupon toast + row state, bundle activation, full simulator journey incl. bundle pop-up + coupon conversion + churn-row clearing, no horizontal overflow at 1440 and 390 (via `Emulation.setDeviceMetricsOverride` — same Windows headless gotcha as before), /martech link regression.
- Gotcha fixed during build: `Card` needs `min-w-0` so the heatmap's `min-w-[720px]` scrolls inside its `overflow-x-auto` instead of stretching the page on mobile. KPI labels are CSS-uppercased — text assertions must be case-insensitive.

**Deployed 2026-07-15** (user ran `vercel --prod`, deployment `dpl_7jGCm2xE1mbEpv4A3vQC8WBXqdbA` aliased to https://bookingweb-smart-space.vercel.app). Prod smoke: 5/5 routes 200 (`/marketing-user`, `/martech`, `/`, `/dashboard`, `/book`) + `/marketing-user` content checks 5/5.

## Latest phase (2026-07-10 later): TH/EN + site integration — DONE ✅

Commit `d8e4fa6`, deployed to prod, smoke 3/3 + content checks.

- **Bilingual `/martech`:** every display string is `LStr { en, th }` resolved via `LangContext`; EN default, persisted in `localStorage("martech-lang")` through `useSyncExternalStore` (ESLint's react-hooks/set-state-in-effect forbids the setState-in-effect pattern — keep using the external-store approach). Technical vocabulary (event names, CRM fields, brands, ROAS/UTM/NPS/CLV) stays English in both languages. Toggle = EN | ไทย pill in TopNav, visible on mobile.
- **Thai font:** `Anuphan` loaded route-scoped in `app/martech/page.tsx` (`--font-anuphan`); Bricolage/Inter have no Thai glyphs, so font stacks are `var(--font-bricolage),var(--font-anuphan)` (headings) and `var(--font-inter),var(--font-anuphan)` (body).
- **Co-working reframe (workflow page only):** hero copy = co-working space rental business; rooms = Meeting A/B, Hot Desk, Office 1/2, Event Space; campaign `monthly-desk-google`; CRM sample `Meeting Room B`. Main app zones untouched.
- **Integration:** marketing sidebar has "Marketing Workflow" → `/martech` (`components/layout/marketing-sidebar.tsx`); landing has a "Marketing OS" glass-card section → `/martech` (`app/page.tsx`). Verified via CDP: login as marketing → sidebar item → navigates to /martech; landing link present.
- Verified TH mode end-to-end via CDP (toggle → Thai content, EN technical terms, reload persistence, 390px no overflow, full-page screenshots reviewed).

## Earlier phase (2026-07-10): `/martech` marketing workflow page — DONE ✅

Built from the user's full brief (see `BriefMartech/WorkFlowLastest.png` — business reference only; layout fully redesigned for Marketing Users).

**Route:** `/martech` — "Closed-Loop Marketing & Room Booking Ecosystem"

**Files (new, nothing else touched):**
- `app/martech/page.tsx` — thin server wrapper (metadata)
- `app/martech/martech-workflow.tsx` — the entire page in one `"use client"` file: mock data at top, then TopNav / Hero (5 count-up KPI cards) / Interactive 5-phase workflow (tab-style phase cards + animated red closed-loop return arrow + expanding detail panel) / CRM data model table (`customer_profile`, 10 fields) / Event tracking architecture (13 events → GA4, Meta Pixel, CRM, Dashboard) / Marketing dashboard (recharts widgets) / Key-goals footer.

**Design system of the page:** deliberately NOT the app's dark-glass theme — self-contained white/blue-600 enterprise-SaaS surface (HubSpot/GA4 look). Signature device: **phase lineage colors** (Acquisition=sky, Conversion=emerald, Purchase=amber, Service=violet, Retention=rose) tag every CRM field, event group, and dashboard widget with the phase that produces it. Fonts reuse the app's loaded vars (Bricolage/Inter/JetBrains Mono). Framer Motion for reveals, count-ups, loop-arrow pathLength, phase-panel transitions; `useReducedMotion` respected everywhere.

**Dependency change:** `framer-motion` added (only change to `package.json`).

**Verification done:**
- `npm run lint` clean; `npm run build` passes (`/martech` prerenders static; all 14 routes build)
- Prod server smoke: `/martech` 200 with all key content; `/` and `/dashboard` untouched (dark theme intact)
- CDP-emulated 390px: `scrollWidth == clientWidth` (no horizontal overflow); full-page screenshots at 390 and 1440 reviewed — all charts render
- ⚠️ Gotcha for future sessions: plain `chrome --headless --screenshot --window-size=390,...` on Windows clamps the window to ~469px and crops the image to 390 → looks like page overflow but isn't. Use CDP `Emulation.setDeviceMetricsOverride` for mobile checks (script pattern in scratchpad `mobile-shot.mjs`).

## Git & deploy (2026-07-10)

- **Git:** own repo at https://github.com/tanawittam-afk/WorkflowMarTech (branch `main`; nested repo inside the parent Claude Code workspace repo — git identity set locally). First commit `322d61b` = full app + /martech.
- **Vercel:** production at **https://bookingweb-smart-space.vercel.app** (project `bookingweb-smart-space`, CLI-linked via `.vercel/`, deployed with `vercel --prod`). Prod smoke 5/5 routes 200 (`/martech`, `/`, `/dashboard`, `/book`, `/analytics`) + /martech content verified. Note: Vercel deploys from local files via CLI, NOT from the GitHub repo — pushing to GitHub alone does not redeploy.

## State / not done
- Production deploy of the retrofit (see "Phase 5" above) — user runs `vercel --prod`.

## How to run

```
cd BookingWeb
npm run dev   # http://localhost:3000/martech
```
