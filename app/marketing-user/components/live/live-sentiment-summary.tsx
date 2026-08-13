"use client";

import Link from "next/link";
import { ArrowRight, MessageSquareText } from "lucide-react";

import { summarizeSentiment } from "@/lib/analytics/sentiment";
import { extractTopics } from "@/lib/analytics/topics";
import type { Review } from "@/lib/data/types";

import { Card, SectionHeader } from "../primitives";

/** Real-data twin of components/dashboard/sentiment-topic-summary.tsx, re-skinned to the CDP's light tokens. */
export function LiveSentimentSummary({ reviews }: { reviews: Review[] }) {
  const summary = summarizeSentiment(reviews);
  const topics = extractTopics(reviews, 6);
  const maxCount = Math.max(...topics.map((t) => t.count), 1);

  return (
    <Card className="p-4">
      <SectionHeader icon={<MessageSquareText className="h-4 w-4" />} title="Sentiment & Topic Cloud" subtitle="Simulated text analytics from customer reviews" />
      <div className="mt-3 flex h-3 overflow-hidden rounded-full">
        <div className="bg-cdp-good" style={{ width: `${summary.positivePercent}%` }} />
        <div className="bg-cdp-border-strong" style={{ width: `${summary.neutralPercent}%` }} />
        <div className="bg-cdp-bad" style={{ width: `${summary.negativePercent}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-cdp-ink3">
        <span>Positive {summary.positivePercent}%</span>
        <span>Neutral {summary.neutralPercent}%</span>
        <span>Negative {summary.negativePercent}%</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {topics.map((t) => {
          const scale = 0.75 + (t.count / maxCount) * 0.6;
          return (
            <span key={t.topic} className="rounded-full bg-cdp-surface-2 px-2.5 py-1 text-cdp-ink2" style={{ fontSize: `${scale * 0.8}rem` }}>
              {t.topic}
            </span>
          );
        })}
      </div>

      <Link href="/analytics?tab=sentiment" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cdp-accent-strong hover:underline">
        Full analysis <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Card>
  );
}
