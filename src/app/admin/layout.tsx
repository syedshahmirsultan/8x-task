import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { hasAdminSession } from "@/lib/admin";

// Single gate: a shared email + password checked against ADMIN_EMAILS /
// ADMIN_PASSWORD, independent of any Clerk sign-in — so the dashboard is
// reachable from any device or account that knows the credentials.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const verified = await hasAdminSession();
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
