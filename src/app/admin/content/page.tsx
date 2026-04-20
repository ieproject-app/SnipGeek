import { AdminShell } from "@/components/admin/admin-shell";
import { ContentTable } from "@/components/admin/content-table";

export const dynamic = "force-dynamic";

export default function AdminContentPage() {
  return (
    <AdminShell>
      <ContentTable />
    </AdminShell>
  );
}
