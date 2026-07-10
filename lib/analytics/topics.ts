// Illustrative for this prototype — frequency-based keyword extraction with
// a small synonym merge, not a trained topic model (e.g. LDA).

import type { Review } from "@/lib/data/types";

const STOPWORDS = new Set([
  "the", "a", "an", "is", "was", "were", "and", "but", "in", "on", "at", "to",
  "for", "of", "with", "our", "my", "we", "i", "it", "this", "that", "here",
  "from", "had", "has", "have", "too", "very", "so", "no", "not", "when",
  "what", "we're", "took", "three", "tries", "all", "be", "you", "your",
  "up", "as", "if", "or", "about", "than", "compared", "nearby", "quality",
  "asked", "twice", "during", "session", "into", "extra", "needed", "used",
  "bit", "group", "exactly", "kept", "them",
]);

const SYNONYMS: Record<string, string> = {
  internet: "wifi",
  aircon: "ac",
  temperature: "ac",
  cold: "ac",
  warm: "ac",
  coffee: "coffee/price",
  price: "coffee/price",
  expensive: "coffee/price",
  staff: "staff/service",
  service: "staff/service",
  rude: "staff/service",
  friendly: "staff/service",
  helpful: "staff/service",
  booking: "booking-ux",
  app: "booking-ux",
  confirmation: "booking-ux",
  soundproof: "noise",
  soundproofing: "noise",
  noise: "noise",
  leaked: "noise",
  wifi: "wifi",
};

export interface TopicEntry {
  topic: string;
  count: number;
}

export function extractTopics(reviews: Review[], limit = 10): TopicEntry[] {
  const counts = new Map<string, number>();
  for (const review of reviews) {
    const tokens = review.text.toLowerCase().split(/\W+/).filter(Boolean);
    const seenInReview = new Set<string>();
    for (const token of tokens) {
      if (STOPWORDS.has(token) || token.length < 3) continue;
      const topic = SYNONYMS[token] ?? token;
      // Count each topic once per review so one gushing review can't dominate.
      if (seenInReview.has(topic)) continue;
      seenInReview.add(topic);
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
