import Link from "next/link";
import { Lock } from "lucide-react";
import { Logo } from "@/components/logo";
import { getAllCategories } from "@/lib/categories";
import { siteConfig } from "@/lib/site-config";

export async function Footer() {
  const categories = await getAllCategories();
  // Only links to pages that exist — no placeholder "Careers" or "Press".
  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: "Shop",
      links: [
        { label: "All products", href: "/products" },
        { label: "Under $50", href: "/products?maxPrice=50" },
      ],
    },
    {
      title: "Categories",
      links: categories.map((c) => ({ label: c.name, href: `/category/${c.slug}` })),
    },
    {
      title: "Your account",
      links: [
        { label: "Account", href: "/account" },
        { label: "Orders", href: "/account/orders" },
        { label: "Cart", href: "/cart" },
      ],
    },
  ];

  return (
    <footer className="mt-24 bg-brand text-white">
      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-white/65">
              Everyday essentials, chosen with care, from headphones to books.
            </p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold text-white">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm whitespace-nowrap text-white/65 transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 py-7 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. A portfolio project.
          </p>
          <p className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            Secure checkout by Stripe — test mode, no real charges
          </p>
        </div>
      </div>
    </footer>
  );
}
