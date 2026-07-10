import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-full)] border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-accent-soft text-accent-strong border-transparent",
        secondary: "bg-surface2 text-ink2 border-transparent",
        outline: "border-line text-ink2",
        success: "bg-success-soft text-success border-transparent",
        warning: "bg-warning-soft text-warning border-transparent",
        danger: "bg-danger-soft text-danger border-transparent",
        "zone-studio": "bg-zone-studio-soft text-zone-studio border-transparent",
        "zone-coworking": "bg-zone-coworking-soft text-zone-coworking border-transparent",
        "zone-cafe": "bg-zone-cafe-soft text-zone-cafe border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
