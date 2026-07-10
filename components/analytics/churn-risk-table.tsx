import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { churnDistribution, type ChurnEntry } from "@/lib/analytics/churn";

const RISK_VARIANT = {
  Low: "success",
  Medium: "warning",
  High: "danger",
} as const;

export function ChurnRiskTable({ entries }: { entries: ChurnEntry[] }) {
  const distribution = churnDistribution(entries);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {distribution.map((d) => (
          <Card key={d.risk}>
            <CardContent className="flex flex-col gap-1">
              <span className="text-sm text-ink3">{d.risk} risk</span>
              <span className="text-stat text-ink">
                {d.count} <span className="text-base font-normal text-ink3">({d.percent}%)</span>
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Churn risk by customer</CardTitle>
          <CardDescription>Rule-based heuristic for demo purposes — not a trained classifier</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Days since last booking</TableHead>
                <TableHead>Avg. CSAT</TableHead>
                <TableHead>Negative review?</TableHead>
                <TableHead>Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.customerId}>
                  <TableCell>
                    {e.name} <span className="text-ink3">({e.customerId})</span>
                  </TableCell>
                  <TableCell>{e.daysSinceLastBooking ?? "—"}</TableCell>
                  <TableCell>{e.avgCsat ?? "—"}</TableCell>
                  <TableCell>{e.hasNegativeReview ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Badge variant={RISK_VARIANT[e.risk]}>{e.risk}</Badge>
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
