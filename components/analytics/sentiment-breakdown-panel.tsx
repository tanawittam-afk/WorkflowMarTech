"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { summarizeSentiment } from "@/lib/analytics/sentiment";
import type { Review } from "@/lib/data/types";

const SENTIMENT_VARIANT = {
  positive: "success",
  neutral: "secondary",
  negative: "danger",
} as const;

export function SentimentBreakdownPanel({ reviews }: { reviews: Review[] }) {
  const summary = summarizeSentiment(reviews);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-sm text-ink3">Positive</span>
            <span className="text-stat text-success">{summary.positivePercent}%</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-sm text-ink3">Neutral</span>
            <span className="text-stat text-ink2">{summary.neutralPercent}%</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-sm text-ink3">Negative</span>
            <span className="text-stat text-danger">{summary.negativePercent}%</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-review sentiment</CardTitle>
          <CardDescription>Lexicon-based heuristic scorer — illustrative, not a trained model</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Review</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Sentiment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.scored.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-md whitespace-normal text-ink2">{r.text}</TableCell>
                  <TableCell>{r.rating}/5</TableCell>
                  <TableCell>
                    <Badge variant={SENTIMENT_VARIANT[r.sentiment]}>{r.sentiment}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
