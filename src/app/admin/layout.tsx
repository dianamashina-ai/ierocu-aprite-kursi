import { requireAdminPage } from "@/lib/backoffice/guard";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";
export const metadata = { title: { default: "Administrācija", template: "%s · Administrācija" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage("/admin");
  return (
    <div className="page-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="border-b border-line pb-3">
          <AdminNav />
        </div>
        <div className="pt-8">{children}</div>
      </div>
    </div>
  );
}
