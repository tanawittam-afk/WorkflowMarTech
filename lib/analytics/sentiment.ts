// Illustrative for this prototype — a small lexicon-based scorer tuned to
// this dataset's actual review vocabulary, not a trained sentiment model.

import type { Review } from "@/lib/data/types";

export type SentimentLabel = "positive" | "neutral" | "negative";

const POSITIVE_WORDS: Record<string, number> = {
  excellent: 2, great: 2, amazing: 2, love: 2, loved: 2, top: 2, "top-notch": 2,
  friendly: 1, helpful: 1, comfortable: 1, clean: 1, quiet: 1, fast: 1, smooth: 1,
  worth: 1, recommend: 2, professional: 1, good: 1, decent: 1, remembered: 1,
  instant: 1, value: 1,
};

const NEGATIVE_WORDS: Record<string, number> = {
  frustrating: 2, confusing: 2, rude: 2, weak: 1, dropping: 1, cold: 1, warm: 1,
  expensive: 1, high: 1, leaked: 2, noise: 1, disappointing: 2, broken: 2,
  crowded: 1, slow: 1,
};

export interface ScoredReview extends Review {
  sentiment: SentimentLabel;
  score: number;
}

export function scoreSentiment(review: Review): ScoredReview {
  const tokens = review.text.toLowerCase().split(/\W+/).filter(Boolean);
  let score = 0;
  for (const t of tokens) {
    score += POSITIVE_WORDS[t] ?? 0;
    score -= NEGATIVE_WORDS[t] ?? 0;
  }
  const normalized = tokens.length ? score / Math.sqrt(tokens.length) : 0;

  // Rating is a secondary tiebreak signal so classification stays grounded.
  let label: SentimentLabel;
  if (normalized > 0.6 || (normalized >= 0 && review.rating >= 4)) label = "positive";
  else if (normalized < -0.4 || (normalized <= 0 && review.rating <= 2)) label = "negative";
  else label = "neutral";

  return { ...review, sentiment: label, score: Math.round(normalized * 100) / 100 };
}

export interface SentimentSummary {
  positive: number;
  neutral: number;
  negative: number;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  scored: ScoredReview[];
}

export function summarizeSentiment(reviews: Review[]): SentimentSummary {
  const scored = reviews.map(scoreSentiment);
  const positive = scored.filter((r) => r.sentiment === "positive").length;
  const neutral = scored.filter((r) => r.sentiment === "neutral").length;
  const negative = scored.filter((r) => r.sentiment === "negative").length;
  const total = reviews.length || 1;
  return {
    positive,
    neutral,
    negative,
    positivePercent: Math.round((positive / total) * 1000) / 10,
    neutralPercent: Math.round((neutral / total) * 1000) / 10,
    negativePercent: Math.round((negative / total) * 1000) / 10,
    scored,
  };
}
