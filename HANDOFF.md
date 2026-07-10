# BookingWeb — HANDOFF

_Last updated: 2026-07-10_

## What this project is

**Smart Space** — a co-working / creator-hub booking demo (Next.js 16 App Router, React 19, Tailwind v4, shadcn-style UI, zustand + localStorage, 100% mock data, no backend). Three route groups: `(auth)` simulated login/register, `(customer)` book → QR check-in → notifications/loyalty, `(marketing)` dashboard + analytics (hand-written k-means, churn, sentiment, topics). The backend-swap seam is `lib/data/repo.ts` (`BookingRepo` interface — a future `supabaseRepo` drops in with zero component changes).

## Latest phase (2026-07-10): `/martech` marketing workflow page — DONE ✅

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

## State / not done

- BookingWeb is **not yet committed** to git (whole folder is untracked; `.gitignore` excludes node_modules/.next). Not deployed this session.
- Known pre-existing loose end: `submitCsat` exists in the store but no UI calls it (customers can't submit a new CSAT rating).
- No cross-link from the main landing page to `/martech` (page links out to `/` and `/dashboard`, but nothing links in). Add one if the user wants it discoverable.

## How to run

```
cd BookingWeb
npm run dev   # http://localhost:3000/martech
```
