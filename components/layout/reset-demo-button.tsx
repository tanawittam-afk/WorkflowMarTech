"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { useBookingStore } from "@/lib/store/booking-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Restores the seeded dataset during a live demo. Confirmation is deliberate —
 * an unguarded single tap here would wipe the walkthrough mid-presentation.
 */
export function ResetDemoButton({ onDone }: { onDone?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const resetDemo = useBookingStore((s) => s.resetDemo);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-ink2 transition-colors hover:bg-surface2"
      >
        <RotateCcw className="size-4" />
        Reset demo data
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset demo data?</DialogTitle>
            <DialogDescription>
              Every booking, beverage order, and coupon created during this session will be
              discarded and the original sample dataset restored. You will stay signed in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                resetDemo();
                setOpen(false);
                onDone?.();
                toast.success("Demo data reset to its original state.");
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
