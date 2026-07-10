import { Coffee } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LoyaltyStampCard({ collected = 0, total = 8 }: { collected?: number; total?: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-ink">Creator Cafe loyalty card</h3>
          <span className="font-mono text-xs text-ink3">
            {collected}/{total}
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={cn(
                "flex size-8 items-center justify-center rounded-[var(--radius-full)] border",
                i < collected
                  ? "border-zone-cafe bg-zone-cafe-soft text-zone-cafe"
                  : "border-dashed border-line text-ink3"
              )}
            >
              <Coffee className="size-4" />
            </div>
          ))}
        </div>
        <p className="text-xs text-ink3">
          {collected >= total ? "Reward unlocked — redeem at the counter!" : `${total - collected} more stamps to a free drink.`}
        </p>
      </CardContent>
    </Card>
  );
}
