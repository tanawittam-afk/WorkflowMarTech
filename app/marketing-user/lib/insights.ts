/**
 * Insight text generators — the copy behind every <InsightStrip>. Each
 * function reads real numbers and returns the fixed 3-line shape the strip
 * renders: "อ่านค่านี้ยังไง" (Descriptive/Diagnostic) → "แปลว่าอะไร"
 * (Predictive) → "ควรทำอะไรต่อ" (Prescriptive). This is how the V2
 * Descriptive→Diagnostic→Predictive→Prescriptive ladder shows up on screen
 * without ever putting that framework's name in front of the user.
 */

import { SALES_GROWTH_TARGET_PCT, type RegressionResult, type RfmRow } from "./analytics-v2";
import { type Metrics } from "./metrics";

export interface Insight {
  read: string;
  meaning: string;
  action: string;
}

export function forecastInsight(reg: RegressionResult): Insight {
  const onTrack = reg.gapPts <= 0;
  return {
    read: `Total Sales ตอนนี้ +${reg.actualGrowthPct.toFixed(1)}% เทียบก่อนเริ่ม CDP, พยากรณ์ 6 เดือน ${reg.forecastGrowthPct.toFixed(1)}%`,
    meaning: onTrack
      ? `ถ้าแนวโน้มปัจจุบันคงที่ จะแตะเป้า +${SALES_GROWTH_TARGET_PCT}% ได้ตามกำหนด`
      : `ถ้าไม่ทำอะไรเพิ่ม จะพลาดเป้า +${SALES_GROWTH_TARGET_PCT}% อยู่ประมาณ ${reg.gapPts.toFixed(1)} จุด`,
    action: onTrack
      ? "รักษาจังหวะแคมเปญปัจจุบันไว้ ไม่ต้องเร่งเพิ่ม"
      : "ดูตัวขับเคลื่อนแต่ละหน้า (พื้นที่ / ลูกค้า / เครื่องดื่ม) เพื่อหาว่าช่องว่างมาจากจุดไหนมากที่สุด",
  };
}

export function occupancyInsight(m: Metrics, dynamicPricing: boolean): Insight {
  const low = m.occupancy < 55;
  return {
    read: `Occupancy เฉลี่ยตอนนี้ ${m.occupancy.toFixed(0)}%${low ? " — ต่ำกว่าช่วงที่ควรจะเป็น" : ""}`,
    meaning: low
      ? "ห้องช่วง Off-Peak (21:00–09:00) ว่างเยอะ เท่ากับรายได้ห้องที่หายไปฟรี ๆ ทุกวัน"
      : "ความหนาแน่นอยู่ในเกณฑ์ดี ห้องช่วง Peak ใกล้เต็มแล้วในหลายวัน",
    action: low
      ? dynamicPricing
        ? "Dynamic Pricing เปิดอยู่แล้ว — ติดตามผล 1-2 สัปดาห์ก่อนปรับส่วนลดเพิ่ม"
        : "เปิด Dynamic Pricing ลดราคาห้องช่วง Off-Peak 18% เพื่อดึงจองเพิ่ม"
      : "พิจารณาขยับราคาช่วง Peak ขึ้นเล็กน้อยแทนการลดราคา Off-Peak เพิ่ม",
  };
}

export function rfmInsight(rows: RfmRow[]): Insight {
  const atRisk = rows.filter((r) => r.tier === "At-Risk");
  const vip = rows.filter((r) => r.tier === "VIP");
  return {
    read: `ลูกค้า At-Risk ${atRisk.length} คน จากทั้งหมด ${rows.length} คน (VIP ${vip.length} คน)`,
    meaning:
      atRisk.length > 0
        ? "กลุ่ม At-Risk คือรายได้ที่กำลังจะหายไปถ้าไม่ทำอะไร — ยิ่งปล่อยไว้นาน โอกาสดึงกลับยิ่งต่ำลง"
        : "ยังไม่มีลูกค้ากลุ่มเสี่ยงหลุดตอนนี้ โฟกัสที่การเลื่อนกลุ่ม Potential ขึ้นเป็น Loyal แทน",
    action:
      atRisk.length > 0
        ? "ส่ง Win-back Coupon ให้กลุ่ม At-Risk ก่อน — เรียงตามยอดสะสม (Monetary) สูงสุดก่อน"
        : "เชิญกลุ่ม VIP เข้าโปรแกรม Early Access เพื่อรักษาระดับ",
  };
}

export function beverageInsight(m: Metrics): Insight {
  const low = m.attach30 < 32;
  return {
    read: `Beverage Attach Rate ${m.attach30.toFixed(0)}% ของการจองทั้งหมด`,
    meaning: low
      ? "ลูกค้าส่วนใหญ่ยังไม่สั่งเครื่องดื่มระหว่างใช้ห้อง — โอกาส Upsell ยังเหลืออีกมาก"
      : "อัตราสั่งเครื่องดื่มอยู่ในเกณฑ์ดี เครื่องดื่มเริ่มเป็นรายได้เส้นที่สองจริงจัง",
    action: low
      ? "เปิดดีลพ่วงตาม Association Rules ที่ Lift สูงสุด แล้วเปิดใช้ Recommendation ตอนสั่งผ่าน QR"
      : "รักษาดีลพ่วงที่ Convert ดีไว้ ทดลองบันเดิลใหม่กับกลุ่มที่ยังไม่สั่งเพิ่ม",
  };
}
