"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, FolderTree, LayoutDashboard, MessageSquareText, Package, ShoppingBag } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <nav
      aria-label="Admin"
      className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-24 lg:mx-0 lg:w-56 lg:shrink-0 lg:flex-col lg:self-start lg:overflow-visible lg:rounded-3xl lg:bg-white lg:p-3 lg:ring-1 lg:ring-ink/[0.05]"
    >
      <p className="hidden px-3 pt-1 pb-2 text-xs font-medium text-muted lg:block">Admin</p>
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex h-10 shrink-0 items-center gap-3 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors lg:rounded-xl lg:px-3 ${
              active
                ? "bg-ink text-white"
                : "bg-white text-ink-2 ring-1 ring-ink/[0.06] hover:text-ink lg:bg-transparent lg:ring-0 lg:hover:bg-paper-2"
            }`}
          >
            <Icon className={`h-[1.1rem] w-[1.1rem] ${active ? "text-accent" : ""}`} />
            {label}
          </Link>
        );
      })}
      <div className="hidden lg:mt-2 lg:block lg:space-y-1 lg:border-t lg:border-line lg:pt-2">
        <Link
          href="/"
          target="_blank"
          className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
        >
          <ExternalLink className="h-[1.1rem] w-[1.1rem]" />
          View store
        </Link>
        <AdminLogoutButton />
      </div>
    </nav>
  );
}
