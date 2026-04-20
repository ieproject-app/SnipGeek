import { AdminShell } from "@/components/admin/admin-shell";
import { DashboardOverview } from "@/components/admin/dashboard-overview";

export const dynamic = "force-dynamic";

export default function AdminOverviewPage() {
  return (
    <AdminShell>
      <DashboardOverview />
    </AdminShell>
  );
}
