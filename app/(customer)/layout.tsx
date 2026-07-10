import { CustomerTopbar } from "@/components/layout/customer-topbar";
import { RoleGuard } from "@/components/layout/role-guard";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="customer">
      <div className="min-h-screen">
        <CustomerTopbar />
        <div className="container-x py-8">{children}</div>
      </div>
    </RoleGuard>
  );
}
