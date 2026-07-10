"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CalendarDays, LogOut, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { useBookingStore } from "@/lib/store/booking-store";

const NAV_ITEMS = [
  { href: "/book", label: "Book a space", icon: CalendarDays },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/account", label: "My account", icon: User },
];

export function CustomerTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useBookingStore((s) => s.logout);
  const customerId = useBookingStore((s) => s.currentCustomerId);
  const customer = useBookingStore((s) => s.customers.find((c) => c.customerId === customerId));

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-[var(--glass-bg-strong)] backdrop-blur-xl">
      <div className="container-x flex h-16 items-center gap-4">
        <Link href="/book" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-linear-to-br from-accent to-accent2 text-onaccent font-heading text-sm font-bold">
            SS
          </div>
          <span className="hidden font-heading text-sm font-semibold text-ink sm:inline">
            Smart Space
          </span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-accent-soft text-accent-strong" : "text-ink2 hover:bg-surface2"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {customer && (
            <span className="hidden text-sm text-ink2 sm:inline">{customer.name}</span>
          )}
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-ink2 transition-colors hover:bg-surface2"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
