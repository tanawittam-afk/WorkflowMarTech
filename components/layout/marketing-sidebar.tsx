"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  LineChart,
  LogOut,
  Users,
  Workflow,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useBookingStore } from "@/lib/store/booking-store";
import { ResetDemoButton } from "@/components/layout/reset-demo-button";

export const NAV_ITEMS = [
  { href: "/marketing-user", label: "Dashboard", icon: LineChart },
  { href: "/analytics", label: "Analytics & Statistics", icon: BarChart3 },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/martech", label: "Marketing Workflow", icon: Workflow },
];

export function MarketingSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useBookingStore((s) => s.logout);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-[var(--glass-bg-strong)] backdrop-blur-xl md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-line px-6">
        <div className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-linear-to-br from-accent to-accent2 text-onaccent font-heading text-sm font-bold">
          SS
        </div>
        <span className="font-heading text-sm font-semibold text-ink">Smart Space</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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
        <ResetDemoButton />
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-ink2 transition-colors hover:bg-surface2"
        >
          <LogOut className="size-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
