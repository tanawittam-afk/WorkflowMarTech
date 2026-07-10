import type { Metadata } from "next";
import { Anuphan } from "next/font/google";
import MartechWorkflow from "./martech-workflow";

// Thai-capable sans for this route only — Bricolage/Inter (loaded in the root
// layout) have no Thai glyphs, so Thai text falls back to Anuphan.
const anuphan = Anuphan({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-anuphan",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Marketing Workflow",
  description:
    "Closed-Loop Marketing & Room Booking Ecosystem — how customer data flows from acquisition to retention and back into the next campaign. Available in English and Thai.",
};

export default function MartechPage() {
  return <MartechWorkflow fontClass={anuphan.variable} />;
}
