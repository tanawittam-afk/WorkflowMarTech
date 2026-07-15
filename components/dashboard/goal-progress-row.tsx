import { Banknote, CupSoda, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BASELINES } from "@/lib/data/mock-data";

function goalProgress(current: number, baseline: number, target: number): number {
  if (target === baseline) return current >= target ? 100 : 0;
  const pct = ((current - baseline) / (target - baseline)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

interface Goal {
  id: string;
  icon: LucideIcon;
  title: string;
  current: string;
  target: string;
  progress: number;
}

export function GoalProgressRow({
  revenue30,
  attachRate30,
  combinedAov30,
}: {
  revenue30: number;
  attachRate30: number;
  combinedAov30: number;
}) {
  const goals: Goal[] = [
    {
      id: "revenue",
      icon: Banknote,
      title: "Goal 1 · Room revenue +15% in 6 months",
      current: `฿${Math.round(revenue30).toLocaleString()} / 30d`,
      target: `Target ฿${Math.round(BASELINES.revenue30 * 1.15).toLocaleString()}`,
      progress: goalProgress(revenue30, BASELINES.revenue30, BASELINES.revenue30 * 1.15),
    },
    {
      id: "attach",
      icon: CupSoda,
      title: "Goal 2 · Beverage attach rate → 40%",
      current: `Current ${attachRate30.toFixed(1)}%`,
      target: "Target 40%",
      progress: goalProgress(attachRate30, BASELINES.attachRate, 40),
    },
    {
      id: "aov",
      icon: TrendingUp,
      title: "Goal 3 · Combined AOV +15%",
      current: `฿${Math.round(combinedAov30).toLocaleString()} / bill`,
      target: `Target ฿${Math.round(BASELINES.aov * 1.15).toLocaleString()}`,
      progress: goalProgress(combinedAov30, BASELINES.aov, BASELINES.aov * 1.15),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {goals.map((g) => (
        <Card key={g.id} variant="glass">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-ink2">
              <span className="flex size-7 items-center justify-center rounded-[var(--radius-md)] bg-surface2 text-accent-strong">
                <g.icon className="size-4" />
              </span>
              <p className="text-xs font-semibold">{g.title}</p>
            </div>
            <Progress value={g.progress} />
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">{g.current}</span>
              <span className="text-ink3">{g.target}</span>
            </div>
            <p className="text-xs text-ink3">
              <span className="font-semibold text-ink2">{g.progress}%</span> of goal
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
