# BookingWeb — HANDOFF

_Last updated: 2026-07-15 (evening — PAUSED mid-retrofit, see current phase below)_

## ⏸️ CURRENT PHASE (2026-07-15, IN PROGRESS): Retrofit main app per new BriefMarTech — paused mid-Phase 3

**Approved plan lives at `C:\Users\User\.claude\plans\partitioned-swinging-teapot.md`** — read it first. Goal: merge the new brief's CDP features into the ORIGINAL dark-glass app (real zustand data), keeping `/marketing-user` and `/martech` untouched.

**User decisions (locked — do not re-ask):** (1) rooms rebuilt per brief: 20 rooms, 3 sizes — Small ฿300/hr cap 5 (desk+WiFi), Medium ฿500/hr cap 10 (+writable Smart TV), Large ฿1000/hr cap 15-20 (+mics & speakers); (2) full customer in-room QR beverage flow; (3) CDP widgets melt into the existing `(marketing)/dashboard`; (4) keep `/marketing-user` as-is; (5) UI English, beverage menu names Thai (Anuphan fallback font still TODO).

### Done so far (lint clean + `npm run build` passes at this commit)

- **Phase 1 ✅ Data model + store:**
  - `lib/data/types.ts` — `ZoneId` = `zone-small|zone-medium|zone-large`; `Customer.lineUid`; new `Beverage`, `OrderLine`, `BeverageOrder`, `BundleRule`
  - `lib/data/mock-data.ts` — rewritten: 3 size-zones + 20 rooms (`room-pod-1..10`, `room-meeting-a..f`, `room-suite-1..4`), `BEVERAGES` (8, Thai names), `BUNDLE_RULES` (3), seeded generator (mulberry32) for ~80 bookings + `BEVERAGE_ORDERS` (attach ~24-38% by persona), churn seeds C005/C008/C013/C017 (recency>30 → churn.ts scores High), `BASELINES` (revenue30/attach 22%/aov) for goal bars, `TODAY_ISO` still 2026-07-06
  - `lib/store/booking-store.ts` — new state `orders/dynamicPricing/activeBundles/winBackSent` + actions `addOrder/toggleDynamicPricing/toggleBundle/sendWinBackCoupon` (win-back pushes a real `broadcast-coupon` notification, id contains `-WB-`); registerCustomer mints lineUid; **persist `version: 2` + migrate discards pre-v2 snapshots**; mockRepo + `lib/data/repo.ts` extended (`listOrders/addOrder/sendWinBackCoupon`)
  - `lib/booking-helpers.ts` — `OFF_PEAK_HOURS` = {9,10,11,21} (bookable range is 9-21), `OFF_PEAK_DISCOUNT` 0.18, `rateForHour`, `priceForSlot`
  - Zone rename sweep done: `globals.css` tokens (`--zone-small/medium/large`, colors unchanged pink/indigo/amber), `badge.tsx` variants, `zone-availability-grid.tsx` (icons BookOpen/MonitorPlay/Mic2), `zone-pie-chart.tsx`, `loyalty-stamp-card.tsx`, cluster chart files
- **Phase 2 ✅ Customer flows:**
  - `room-slot-picker.tsx` — `priceForSlot` + "Off-Peak −18%" in hour dropdown + struck-through full price
  - `book/confirm/confirm-form.tsx` — rewritten: auto-applies win-back coupon (−15%, marks `clickCoupon` → existing check-in attribution), Smart-Bundle Dialog when an active rule matches zone+hour (accept → `addOrder` pre-order at −15%)
  - NEW `components/qr/in-room-order-panel.tsx` (menu + qty steppers + accumulated "Teenoi" bill + 2h-no-order auto-trigger banner) and `components/qr/checkout-summary.tsx` (round1+round2 bill + **CSAT stars → `submitCsat`**, closing the old gap); wired into `qr/[bookingId]/page.tsx` (checked-in → order panel; completed → summary)
  - `account/page.tsx` — shows LINE UID instead of internal customerId

### NOT done yet

- **Phase 3 (was just starting):** rebuild `(marketing)/dashboard/page.tsx` per brief blueprint — goal-progress row (use `BASELINES`), 8 KPI `MetricCard`s (add Occupancy / Combined AOV / Top Services / LINE OA Conversion), NEW components `components/dashboard/{goal-progress-row,occupancy-heatmap,beverage-bar-chart,churn-winback-table,bundling-panel}.tsx` (port heatmap from `app/marketing-user/marketing-user.tsx`, dark palette; churn table = `computeChurnRisks` High rows + `sendWinBackCoupon` button + sonner toast; keep `ConversionLineChart`+`SentimentTopicSummary`, drop `OccupancyBarChart`). Dashboard page + `metric-card.tsx` already read, unmodified.
- **Phase 4 remainder:** Anuphan fallback in `app/layout.tsx` (Thai menu names currently render with system fallback font!), LINE UID column in `(marketing)/customers` table, check `lib/analytics/topics.ts` synonym map still matches new review texts (reviews were rewritten: wifi/smart tv/mic/QR-order/boba topics), general grep for stale copy mentioning studio/cafe.
- **Phase 5:** extended CDP smoke (scratchpad `cdp/smoke.mjs` from earlier this session has the ws+CDP pattern — but scratchpad is session-scoped, may be gone; pattern documented in git history of this HANDOFF), 390px mobile check, HANDOFF final update, commit, **deploy = user runs `vercel --prod`** (agent is permission-blocked from deploying).

### Gotchas hit this session
- Google-Fonts fetch during `next build` fails transiently (network) → build errors mentioning `font/google/*.woff2` module-not-found; just retry.
- localStorage from before this retrofit holds old zone ids → handled by persist v2 migrate (discards). If weird data appears, clear key `bookingweb-session`.

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
- Known pre-existing loose end: `submitCsat` exists in the store but no UI calls it (customers can't submit a new CSAT rating).

## How to run

```
cd BookingWeb
npm run dev   # http://localhost:3000/martech
```
