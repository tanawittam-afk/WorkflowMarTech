/**
 * Reducer — the single write path for the dashboard. Every marketer action and
 * every step the customer simulator commits flows through here, which is what
 * keeps the dashboard numbers moving in real time.
 */

import {
  BEV_BY_ID,
  BUNDLE_RULES,
  CUSTOMER_BY_UID,
  type AppEvent,
  type AppState,
  type Booking,
  type OrderLine,
  type Proposal,
} from "./domain";

/* ============================================================
   Reducer
   ============================================================ */

export type Action =
  | { type: "toggleDynamicPricing" }
  | { type: "sendCoupon"; uid: string }
  | { type: "toggleBundle"; ruleId: string }
  | { type: "simBook"; booking: Booking; customerName: string }
  | { type: "simCheckout"; bookingId: string; lines: OrderLine[]; rating: number; customerName: string }
  | { type: "propose"; proposal: Omit<Proposal, "id" | "status"> }
  | { type: "approveProposal"; id: string }
  | { type: "rejectProposal"; id: string };

export function pushEvent(state: AppState, text: string, tone: AppEvent["tone"]): Pick<AppState, "events" | "nextEventId"> {
  return {
    events: [{ id: state.nextEventId, text, tone }, ...state.events].slice(0, 8),
    nextEventId: state.nextEventId + 1,
  };
}

export function appReducer(state: AppState, action: Action): AppState {
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

    // ── Human-in-the-loop: every marketer action lands here `pending` first,
    // and only takes effect once approveProposal fires it. ────────────────
    case "propose": {
      const proposal: Proposal = { ...action.proposal, id: `P${state.nextProposalId}`, status: "pending" };
      return {
        ...state,
        proposals: [proposal, ...state.proposals],
        nextProposalId: state.nextProposalId + 1,
        ...pushEvent(state, `เสนอ: ${proposal.title} — รอการอนุมัติ`, "info"),
      };
    }
    case "approveProposal": {
      const proposal = state.proposals.find((p) => p.id === action.id);
      if (!proposal || proposal.status !== "pending") return state;

      let next: AppState = {
        ...state,
        proposals: state.proposals.map((p) => (p.id === action.id ? { ...p, status: "approved" as const } : p)),
      };

      if (proposal.payload.kind === "coupon") {
        const newUids = proposal.payload.uids.filter((uid) => !next.couponOffers.includes(uid));
        next = {
          ...next,
          couponOffers: [...next.couponOffers, ...newUids],
          couponsSent: next.couponsSent + newUids.length,
        };
      } else if (proposal.payload.kind === "bundle") {
        if (!next.activeBundles.includes(proposal.payload.ruleId)) {
          next = { ...next, activeBundles: [...next.activeBundles, proposal.payload.ruleId] };
        }
      } else if (proposal.payload.kind === "pricing") {
        next = { ...next, dynamicPricing: true };
      }

      return { ...next, ...pushEvent(next, `อนุมัติแล้ว: ${proposal.title} — เริ่มมีผลทันที`, "success") };
    }
    case "rejectProposal": {
      const proposal = state.proposals.find((p) => p.id === action.id);
      if (!proposal || proposal.status !== "pending") return state;
      return {
        ...state,
        proposals: state.proposals.map((p) => (p.id === action.id ? { ...p, status: "rejected" as const } : p)),
        ...pushEvent(state, `ปฏิเสธ: ${proposal.title}`, "warn"),
      };
    }
  }
}

/* ============================================================
   Formatting + small UI atoms
   ============================================================ */
