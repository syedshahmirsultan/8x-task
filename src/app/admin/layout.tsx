import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminNav } from "@/components/admin/admin-nav";
import { hasAdminSession } from "@/lib/admin";

// Single gate: a shared email + password checked against ADMIN_EMAILS /
// ADMIN_PASSWORD, independent of any Clerk sign-in — so the dashboard is
// reachable from any device or account that knows the credentials.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const verified = await hasAdminSession();
  if (!verified) return <AdminLoginForm />;

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pt-6 sm:px-6 lg:flex-row lg:gap-8"
    >
      <AdminNav />
      <div className="min-w-0 flex-1">{children}</div>
    </main>
  );
}
