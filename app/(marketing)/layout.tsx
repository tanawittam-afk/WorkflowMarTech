import { MarketingSidebar } from "@/components/layout/marketing-sidebar";
import { RoleGuard } from "@/components/layout/role-guard";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="marketing">
      <div className="flex min-h-screen">
        <MarketingSidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </RoleGuard>
  );
}
