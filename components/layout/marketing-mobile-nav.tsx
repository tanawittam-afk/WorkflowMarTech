"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { useBookingStore } from "@/lib/store/booking-store";
import { NAV_ITEMS } from "@/components/layout/marketing-sidebar";
import { ResetDemoButton } from "@/components/layout/reset-demo-button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Phone-width counterpart to MarketingSidebar, which is `md:flex` only. Without
 * this the marketing section is a dead end on a phone — no nav, no sign-out.
 */
export function MarketingMobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const logout = useBookingStore((s) => s.logout);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-[var(--radius-md)] p-2 text-ink2 hover:bg-surface2 md:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="left-0 top-0 h-full w-72 max-w-[80vw] translate-x-0 translate-y-0 grid-rows-[auto_1fr_auto] gap-0 rounded-none border-y-0 border-l-0 p-0"
          showClose={false}
        >
          <div className="flex h-16 items-center gap-2 border-b border-line px-6">
            <div className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-linear-to-br from-accent to-accent2 text-onaccent font-heading text-sm font-bold">
              SS
            </div>
            <DialogTitle className="text-sm">Smart Space</DialogTitle>
          </div>

          <nav className="flex flex-col gap-1 overflow-y-auto p-3">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-accent-soft text-accent-strong" : "text-ink2 hover:bg-surface2"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col gap-1 border-t border-line p-3">
            <ResetDemoButton onDone={() => setOpen(false)} />
            <button
              onClick={() => {
                logout();
                setOpen(false);
                router.push("/login");
              }}
              className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-ink2 transition-colors hover:bg-surface2"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
