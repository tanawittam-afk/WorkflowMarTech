"use client";

import { Menu } from "lucide-react";

export function MarketingTopbar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-line bg-[var(--glass-bg-strong)] px-4 backdrop-blur-xl md:px-8">
      <button className="rounded-[var(--radius-md)] p-2 text-ink2 hover:bg-surface2 md:hidden" aria-label="Open menu">
        <Menu className="size-5" />
      </button>
      <h1 className="font-heading text-xl font-semibold text-ink">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <span className="rounded-[var(--radius-full)] bg-accent-soft px-3 py-1 text-xs font-medium text-accent-strong">
          Marketing Team
        </span>
      </div>
    </header>
  );
}
