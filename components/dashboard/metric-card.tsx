import { Card, CardContent } from "@/components/ui/card";
import { StatDeltaChip } from "@/components/shared/stat-delta-chip";

export function MetricCard({
  label,
  value,
  delta,
  caption,
}: {
  label: string;
  value: string;
  delta?: number;
  caption?: string;
}) {
  return (
    <Card variant="glass">
      <CardContent className="flex flex-col gap-2.5">
        <span className="text-sm font-medium text-ink3">{label}</span>
        <div className="flex items-end justify-between gap-2">
          <span className="text-stat text-ink">{value}</span>
          {delta !== undefined && <StatDeltaChip delta={delta} />}
        </div>
        {caption && <span className="text-xs text-ink3">{caption}</span>}
      </CardContent>
    </Card>
  );
}
