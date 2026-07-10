import { Suspense } from "react";

import { MarketingTopbar } from "@/components/layout/marketing-topbar";
import { AnalyticsTabs } from "./analytics-tabs";

export default function AnalyticsPage() {
  return (
    <>
      <MarketingTopbar title="Analytics & Statistics" />
      <div className="flex-1 p-6 md:p-10">
        <Suspense fallback={null}>
          <AnalyticsTabs />
        </Suspense>
      </div>
    </>
  );
}
