import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ClusterSummary } from "@/lib/analytics/kmeans";

const CLUSTER_COLORS = ["var(--accent)", "var(--accent-2)", "var(--zone-cafe)"];

export function ClusterInterpretationCard({ summaries }: { summaries: ClusterSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Segment interpretation</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Segment</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Avg. age</TableHead>
              <TableHead>Avg. income</TableHead>
              <TableHead>Majority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaries.map((s) => (
              <TableRow key={s.cluster}>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: CLUSTER_COLORS[s.cluster % CLUSTER_COLORS.length] }}
                    />
                    {s.label}
                  </span>
                </TableCell>
                <TableCell>{s.size}</TableCell>
                <TableCell>{s.avgAge}</TableCell>
                <TableCell>฿{s.avgIncome.toLocaleString()}</TableCell>
                <TableCell>{s.majorityOccupation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
