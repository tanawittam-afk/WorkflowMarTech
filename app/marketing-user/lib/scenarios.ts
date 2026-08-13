/**
 * Business Scenario resolver — Proposal_V2 §6.2's A–E decision playbook.
 * Reads real numbers off the regression + metrics + RFM tiers and picks the
 * one scenario that best explains *why* Total Sales is where it is, plus
 * the one recommended next move. This is what turns Page 1's hero into a
 * decision, not just a status readout.
 */

import { type RegressionResult, type RfmRow, SALES_GROWTH_TARGET_PCT } from "./analytics-v2";
import { type Metrics } from "./metrics";

export type ScenarioId = "A" | "B" | "C" | "D" | "E";

export interface Scenario {
  id: ScenarioId;
  label: string;
  headline: string;
  detail: string;
  actionLabel: string;
  tone: "good" | "warn" | "bad";
}

const ATTACH_GAP_THRESHOLD = 32; // % — below this, beverage upsell is under-realized
const AT_RISK_GAP_THRESHOLD = 4; // customers — above this, retention is the bottleneck
const OCCUPANCY_GAP_THRESHOLD = 55; // % — below this, off-peak room demand is the bottleneck

export function resolveScenario(reg: RegressionResult, m: Metrics, rfm: RfmRow[]): Scenario {
  const atRiskCount = rfm.filter((r) => r.tier === "At-Risk").length;
  const roomGap = m.occupancy < OCCUPANCY_GAP_THRESHOLD;
  const beverageGap = m.attach30 < ATTACH_GAP_THRESHOLD;
  const retentionGap = atRiskCount >= AT_RISK_GAP_THRESHOLD;
  const gapCount = [roomGap, beverageGap, retentionGap].filter(Boolean).length;

  if (reg.forecastGrowthPct >= SALES_GROWTH_TARGET_PCT) {
    return {
      id: "A",
      label: "A · ถึงเป้าแล้ว",
      headline: `พยากรณ์ ${reg.forecastGrowthPct.toFixed(1)}% ถึงเป้า +${SALES_GROWTH_TARGET_PCT}% แล้ว`,
      detail: "รักษาแคมเปญที่ได้ผลไว้ต่อ และลดส่วนลดที่ไม่จำเป็นลงเพื่อคุมกำไร ไม่ต้องเปิดโปรใหม่เพิ่ม",
      actionLabel: "ทบทวนแคมเปญที่กำลังทำงาน",
      tone: "good",
    };
  }

  if (gapCount >= 2) {
    return {
      id: "E",
      label: "E · ช่องว่างหลายจุด",
      headline: `พยากรณ์ต่ำกว่าเป้า ${reg.gapPts.toFixed(1)} จุด จากหลายสาเหตุพร้อมกัน`,
      detail: "Room / Beverage / Retention มีช่องว่างพร้อมกัน — จัดลำดับตาม Revenue Impact ที่ประเมินไว้ในแต่ละหน้าก่อนลงมือ",
      actionLabel: "ดูรายละเอียดทีละหน้า",
      tone: "bad",
    };
  }

  if (roomGap) {
    return {
      id: "B",
      label: "B · Room Revenue Gap",
      headline: `Occupancy ${m.occupancy.toFixed(0)}% ต่ำกว่าที่ควร — ห้องช่วง Off-Peak ว่างเยอะ`,
      detail: "เปิด Dynamic Pricing ลดราคาช่วง Off-Peak หรือทำโปรโมชันดึงจองเพิ่มในช่วงเวลาที่ว่าง",
      actionLabel: "ไปที่หน้าพื้นที่และรายได้",
      tone: "warn",
    };
  }

  if (beverageGap) {
    return {
      id: "C",
      label: "C · Beverage Upsell Gap",
      headline: `Beverage Attach Rate ${m.attach30.toFixed(0)}% ยังต่ำกว่าศักยภาพ`,
      detail: "ใช้ผล Market Basket Analysis + Recommendation System เปิดดีลพ่วงเครื่องดื่มตามห้อง/ช่วงเวลาที่มี Lift สูง",
      actionLabel: "ไปที่หน้าเครื่องดื่มและแคมเปญ",
      tone: "warn",
    };
  }

  if (retentionGap) {
    return {
      id: "D",
      label: "D · Retention Gap",
      headline: `ลูกค้ากลุ่ม At-Risk ${atRiskCount} คน กำลังจะหลุดจากระบบ`,
      detail: "ส่ง Win-back Coupon ผ่าน LINE OA ให้กลุ่ม At-Risk ตามคำแนะนำในตาราง RFM ก่อนหายไปถาวร",
      actionLabel: "ไปที่หน้าลูกค้าและความภักดี",
      tone: "warn",
    };
  }

  return {
    id: "E",
    label: "E · ใกล้เป้า",
    headline: `พยากรณ์ต่ำกว่าเป้าเล็กน้อย ${reg.gapPts.toFixed(1)} จุด`,
    detail: "ไม่มีสัญญาณช่องว่างชัดเจนจุดใดจุดหนึ่ง — ติดตามต่ออีก 1 รอบก่อนตัดสินใจเปิดแคมเปญใหม่",
    actionLabel: "ดูตัวขับเคลื่อนรายหน้า",
    tone: "warn",
  };
}
