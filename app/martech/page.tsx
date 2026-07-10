import type { Metadata } from "next";
import MartechWorkflow from "./martech-workflow";

export const metadata: Metadata = {
  title: "Marketing Workflow",
  description:
    "Closed-Loop Marketing & Room Booking Ecosystem — how customer data flows from acquisition to retention and back into the next campaign.",
};

export default function MartechPage() {
  return <MartechWorkflow />;
}
