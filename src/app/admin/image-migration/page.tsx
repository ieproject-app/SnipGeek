import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { ImageMigrationWorkspace } from "@/components/admin/image-migration/workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Image Migration — Admin — SnipGeek",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminImageMigrationPage() {
  return (
    <AdminShell>
      <ImageMigrationWorkspace />
    </AdminShell>
  );
}
