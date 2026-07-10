import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatDeltaChip({ delta }: { delta: number }) {
  const positive = delta >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-[var(--radius-full)] px-2 py-0.5 text-xs font-medium",
        positive ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
      )}
    >
      {positive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}
