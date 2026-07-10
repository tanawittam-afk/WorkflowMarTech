"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { useBookingStore, type UserRole } from "@/lib/store/booking-store";

function useStoreHydrated() {
  return useSyncExternalStore(
    (onChange) => useBookingStore.persist.onFinishHydration(onChange),
    () => useBookingStore.persist.hasHydrated(),
    () => false
  );
}

/** Client-side guard for this simulated (no real backend) app — redirects if the session role doesn't match. */
export function RoleGuard({
  requiredRole,
  children,
}: {
  requiredRole: Exclude<UserRole, null>;
  children: React.ReactNode;
}) {
  const role = useBookingStore((s) => s.role);
  const router = useRouter();
  const hydrated = useStoreHydrated();

  useEffect(() => {
    if (hydrated && role !== requiredRole) {
      router.replace("/login");
    }
  }, [hydrated, role, requiredRole, router]);

  if (!hydrated || role !== requiredRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <div className="text-sm text-ink3">Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}
