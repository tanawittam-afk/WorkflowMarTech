"use client";

import { Link2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHour } from "@/lib/booking-helpers";
import { BEVERAGES, BUNDLE_RULES } from "@/lib/data/mock-data";
import { useBookingStore } from "@/lib/store/booking-store";

export function BundlingPanel() {
  const activeBundles = useBookingStore((s) => s.activeBundles);
  const toggleBundle = useBookingStore((s) => s.toggleBundle);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-accent-strong" />
          Smart Bundling
        </CardTitle>
        <CardDescription>
          Simulated Apriori association rules — activate to offer at -15% on booking-confirm
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {BUNDLE_RULES.map((rule) => {
          const bev = BEVERAGES.find((b) => b.id === rule.bevId);
          const active = activeBundles.includes(rule.id);
          return (
            <div
              key={rule.id}
              className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-line px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-2">
                <Link2 className="mt-0.5 size-4 shrink-0 text-ink3" />
                <div>
                  <p className="text-sm text-ink">
                    {formatHour(rule.hourFrom)} – {formatHour(rule.hourTo)} · {bev?.name ?? rule.bevId}
                  </p>
                  <p className="text-xs text-ink3">{rule.pitch}</p>
                  <p className="mt-1 text-xs text-ink3">
                    Lift <span className="font-mono text-ink2">{rule.lift}x</span> · Confidence{" "}
                    <span className="font-mono text-ink2">{rule.confidence}%</span>
                  </p>
                </div>
              </div>
              <Button size="sm" variant={active ? "default" : "outline"} onClick={() => toggleBundle(rule.id)}>
                {active ? "Active" : "Activate"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
