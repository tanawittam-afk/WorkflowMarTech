"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { summarizeSentiment } from "@/lib/analytics/sentiment";
import { extractTopics } from "@/lib/analytics/topics";
import type { Review } from "@/lib/data/types";

export function SentimentTopicSummary({ reviews }: { reviews: Review[] }) {
  const summary = summarizeSentiment(reviews);
  const topics = extractTopics(reviews, 6);
  const maxCount = Math.max(...topics.map((t) => t.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sentiment & Topic Cloud</CardTitle>
        <CardDescription>Simulated text analytics from customer reviews</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex h-3 overflow-hidden rounded-[var(--radius-full)]">
          <div className="bg-success" style={{ width: `${summary.positivePercent}%` }} />
          <div className="bg-line-strong" style={{ width: `${summary.neutralPercent}%` }} />
          <div className="bg-danger" style={{ width: `${summary.negativePercent}%` }} />
        </div>
        <div className="flex justify-between text-xs text-ink3">
          <span>Positive {summary.positivePercent}%</span>
          <span>Neutral {summary.neutralPercent}%</span>
          <span>Negative {summary.negativePercent}%</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {topics.map((t) => {
            const scale = 0.75 + (t.count / maxCount) * 0.6;
            return (
              <span
                key={t.topic}
                className="rounded-[var(--radius-full)] bg-surface2 px-2.5 py-1 text-ink2"
                style={{ fontSize: `${scale * 0.8}rem` }}
              >
                {t.topic}
              </span>
            );
          })}
        </div>

        <Button asChild variant="ghost" size="sm" className="self-start px-0 text-accent-strong hover:bg-transparent">
          <Link href="/analytics?tab=sentiment">
            Full analysis <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
