/**
 * Proposal_V2 §1.2 — the 8-dimension Marketing Questions table (4P +
 * Customer Experience / Customer Loyalty / Revenue & Profitability). Static
 * reference content: which business question each dashboard page answers.
 * No computation — just a map from dimension to page.
 */

export interface MarketingQuestion {
  dimension: string;
  question: string;
  page: "exec" | "space" | "customer" | "beverage";
  pageLabel: string;
}

export const MARKETING_QUESTIONS: MarketingQuestion[] = [
  {
    dimension: "Customer",
    question: "ลูกค้ากลุ่มใดมีแนวโน้มซื้อเครื่องดื่มจาก Smart Space มากที่สุด?",
    page: "customer",
    pageLabel: "ลูกค้าและความภักดี",
  },
  {
    dimension: "Product",
    question: "เครื่องดื่มประเภทใดที่ลูกค้าต้องการซื้อจาก Smart Space มากที่สุด?",
    page: "beverage",
    pageLabel: "เครื่องดื่มและแคมเปญ",
  },
  {
    dimension: "Price",
    question: "ลูกค้ายอมรับราคาเครื่องดื่มในช่วงใด?",
    page: "beverage",
    pageLabel: "เครื่องดื่มและแคมเปญ",
  },
  {
    dimension: "Place",
    question: "ช่องทางใดเหมาะสมที่สุดสำหรับการจำหน่ายเครื่องดื่มให้ลูกค้า Smart Space?",
    page: "beverage",
    pageLabel: "เครื่องดื่มและแคมเปญ",
  },
  {
    dimension: "Promotion",
    question: "โปรโมชันหรือแพ็กเกจแบบใดช่วยกระตุ้นให้ลูกค้าซื้อเครื่องดื่มร่วมกับการจองพื้นที่ได้มากที่สุด?",
    page: "beverage",
    pageLabel: "เครื่องดื่มและแคมเปญ",
  },
  {
    dimension: "Customer Experience",
    question: "การมีบริการจำหน่ายเครื่องดื่มช่วยเพิ่มความพึงพอใจของลูกค้าหรือไม่?",
    page: "customer",
    pageLabel: "ลูกค้าและความภักดี",
  },
  {
    dimension: "Customer Loyalty",
    question: "การซื้อเครื่องดื่มมีผลต่อโอกาสที่ลูกค้าจะกลับมาใช้บริการซ้ำหรือไม่?",
    page: "customer",
    pageLabel: "ลูกค้าและความภักดี",
  },
  {
    dimension: "Revenue & Profitability",
    question: "การจำหน่ายเครื่องดื่มสามารถเพิ่มรายได้และกำไรต่อผู้ใช้บริการได้มากน้อยเพียงใด?",
    page: "exec",
    pageLabel: "ภาพรวมผู้บริหาร",
  },
];
