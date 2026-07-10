import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { extractTopics } from "@/lib/analytics/topics";
import type { Review } from "@/lib/data/types";

export function TopicCloud({ reviews }: { reviews: Review[] }) {
  const topics = extractTopics(reviews, 10);
  const maxCount = Math.max(...topics.map((t) => t.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Topic keywords</CardTitle>
        <CardDescription>Frequency-based extraction — illustrative, not a trained topic model (e.g. LDA)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          {topics.map((t) => {
            const scale = 0.9 + (t.count / maxCount) * 1.4;
            return (
              <span
                key={t.topic}
                className="rounded-[var(--radius-full)] bg-accent-soft px-3 py-1 font-medium text-accent-strong"
                style={{ fontSize: `${scale}rem` }}
              >
                {t.topic}
                <span className="ml-1.5 font-mono text-xs opacity-60">{t.count}</span>
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
