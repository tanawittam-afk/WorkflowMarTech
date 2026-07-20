# BookingWeb — HANDOFF

_Last updated: 2026-07-20 (presentation-ready pass — DEPLOYED; click-test outstanding)_

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
