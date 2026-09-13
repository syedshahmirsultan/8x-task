import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { getAdminUser, hasAdminSession } from "@/lib/admin";

// Two gates, not one: Clerk sign-in + email allowlist (a 404, not a sign-in
// redirect, so the section's existence isn't revealed to non-admins) — then
// a separate shared password re-entered explicitly before the dashboard
// itself renders, so being signed in as an allowlisted admin alone isn't
// enough to land straight on it.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await getAdminUser();
  if (!admin) notFound();

  const verified = await hasAdminSession(admin.id);
  if (!verified) return <AdminLoginForm />;

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8">
      <nav className="w-48 shrink-0 space-y-1 text-sm">
        <p className="mb-3 px-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">Admin</p>
        <Link href="/admin" className="block rounded-md px-3 py-2 font-medium hover:bg-background">
          Overview
        </Link>
        <Link href="/admin/products" className="block rounded-md px-3 py-2 font-medium hover:bg-background">
          Products
        </Link>
        <Link href="/admin/orders" className="block rounded-md px-3 py-2 font-medium hover:bg-background">
          Orders
        </Link>
        <Link href="/admin/reviews" className="block rounded-md px-3 py-2 font-medium hover:bg-background">
          Reviews
        </Link>
        <div className="pt-2">
          <AdminLogoutButton />
        </div>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </main>
  );
}
