"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerProfilePanel } from "@/components/analytics/customer-profile-panel";
import { ClusterScatterChart } from "@/components/analytics/cluster-scatter-chart";
import { ClusterInterpretationCard } from "@/components/analytics/cluster-interpretation-card";
import { SentimentBreakdownPanel } from "@/components/analytics/sentiment-breakdown-panel";
import { TopicCloud } from "@/components/analytics/topic-cloud";
import { ChurnRiskTable } from "@/components/analytics/churn-risk-table";
import { useBookingStore, TODAY_ISO } from "@/lib/store/booking-store";
import { runKMeans } from "@/lib/analytics/kmeans";
import { computeChurnRisks } from "@/lib/analytics/churn";

const VALID_TABS = ["profile", "clustering", "sentiment", "topics"];

export function AnalyticsTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab");
  const tab = VALID_TABS.includes(tabParam ?? "") ? tabParam! : "profile";

  const customers = useBookingStore((s) => s.customers);
  const reviews = useBookingStore((s) => s.reviews);
  const bookings = useBookingStore((s) => s.bookings);

  const kmeans = useMemo(() => runKMeans(customers, 3), [customers]);
  const churnEntries = useMemo(
    () => computeChurnRisks(customers, bookings, reviews, TODAY_ISO),
    [customers, bookings, reviews]
  );

  function setTab(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.push(`/analytics?${params.toString()}`, { scroll: false });
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="profile">Who are our customers?</TabsTrigger>
        <TabsTrigger value="clustering">Segmentation</TabsTrigger>
        <TabsTrigger value="sentiment">Opinions</TabsTrigger>
        <TabsTrigger value="topics">Topics & churn</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <CustomerProfilePanel customers={customers} />
      </TabsContent>

      <TabsContent value="clustering" className="flex flex-col gap-4">
        <ClusterScatterChart points={kmeans.points} summaries={kmeans.summaries} />
        <ClusterInterpretationCard summaries={kmeans.summaries} />
      </TabsContent>

      <TabsContent value="sentiment">
        <SentimentBreakdownPanel reviews={reviews} />
      </TabsContent>

      <TabsContent value="topics" className="flex flex-col gap-4">
        <TopicCloud reviews={reviews} />
        <ChurnRiskTable entries={churnEntries} />
      </TabsContent>
    </Tabs>
  );
}
