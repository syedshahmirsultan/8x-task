import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, DollarSign, MessageSquareText, Package, ShoppingBag } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderStatusPill } from "@/components/admin/admin-order-status";
import { formatPrice } from "@/lib/format";
import { getAllOrders } from "@/lib/orders";
import { getAllProducts } from "@/lib/products";
import { getAllReviews } from "@/lib/reviews";

/** Matches the storefront's "Only N left" threshold. */
const LOW_STOCK = 5;

interface StockAlert {
  key: string;
  productId: string;
  title: string;
  /** Version label, when the alert is for one version of a product. */
  version?: string;
  image: string;
  stock: number;
}

export default async function AdminOverviewPage() {
  const [products, orders, reviews] = await Promise.all([getAllProducts(), getAllOrders(), getAllReviews()]);
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  // Checked per version: a product's stock is the sum of its versions, so a
  // sold-out version would otherwise hide behind its siblings' stock.
  const lowStock = products
    .flatMap<StockAlert>((product) =>
      product.variants?.length
        ? product.variants
            .filter((v) => v.stock <= LOW_STOCK)
            .map((v) => ({
              key: v.id,
              productId: product.id,
              title: product.title,
              version: v.label,
              image: v.image ?? product.images[0],
              stock: v.stock,
            }))
        : product.stock <= LOW_STOCK
          ? [
              {
                key: product.id,
                productId: product.id,
                title: product.title,
                version: undefined,
                image: product.images[0],
                stock: product.stock,
              },
            ]
          : [],
    )
    .sort((a, b) => a.stock - b.stock);
  const soldOut = lowStock.filter((item) => item.stock === 0).length;
  const recentOrders = orders.slice(0, 5);

  const stats = [
    {
      label: "Revenue",
      value: formatPrice(revenue),
      detail: orders.length ? `${formatPrice(Math.round(revenue / orders.length))} average order` : "No orders yet",
      href: "/admin/orders",
      icon: DollarSign,
    },
    {
      label: "Orders",
      value: orders.length.toString(),
      detail: `${orders.filter((o) => o.status === "Processing").length} to fulfil`,
      href: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      label: "Products",
      value: products.length.toString(),
      detail: soldOut
        ? `${soldOut} sold out${lowStock.length > soldOut ? ` · ${lowStock.length - soldOut} running low` : ""}`
        : lowStock.length
          ? `${lowStock.length} running low`
          : "All well stocked",
      href: "/admin/products",
      icon: Package,
    },
    {
      label: "Reviews",
      value: reviews.length.toString(),
      detail: reviews.length
        ? `${(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} average rating`
        : "None yet",
      href: "/admin/reviews",
      icon: MessageSquareText,
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Overview" description="How the store is doing at a glance." />

      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, detail, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-3xl bg-white p-5 ring-1 ring-ink/[0.05] transition-[transform,box-shadow] duration-300 ease-(--ease-out) hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_rgb(19_25_33/0.45)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-2">{label}</p>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-paper-2 text-ink transition-colors group-hover:bg-ink group-hover:text-accent">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-[1.75rem] leading-none font-bold tracking-tight text-ink tabular-nums">{value}</p>
            <p className="mt-2 truncate text-xs text-muted">{detail}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Recent orders" href="/admin/orders" linkLabel="All orders">
          {recentOrders.length ? (
            <ul className="divide-y divide-line">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center gap-3 py-3">
                  <div className="flex -space-x-3">
                    {order.items.slice(0, 3).map((item, i) => (
                      <span
                        key={`${order.id}-${i}`}
                        className="relative h-10 w-10 overflow-hidden rounded-xl bg-surface ring-2 ring-white"
                      >
                        {item.image && <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />}
                      </span>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {order.items.map((item) => item.title).join(", ")}
                    </p>
                    <p className="text-xs text-muted">
                      #{order.id.slice(0, 8)} ·{" "}
                      {new Date(order.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-ink tabular-nums">{formatPrice(order.total)}</p>
                  <OrderStatusPill status={order.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote>No orders yet — they&apos;ll show up here the moment a customer checks out.</EmptyNote>
          )}
        </Panel>

        <Panel title="Low stock" href="/admin/products" linkLabel="All products">
          {lowStock.length ? (
            <ul className="divide-y divide-line">
              {lowStock.slice(0, 6).map((item) => (
                <li key={item.key}>
                  <Link href={`/admin/products/${item.productId}`} className="group flex items-center gap-3 py-3">
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-surface">
                      <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink group-hover:text-link">
                        {item.title}
                      </span>
                      {item.version && <span className="block truncate text-xs text-muted">{item.version}</span>}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
                        item.stock === 0 ? "bg-accent-strong/10 text-accent-strong" : "bg-accent/15 text-ink"
                      }`}
                    >
                      {item.stock === 0 ? "Sold out" : `${item.stock} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote icon>Every product and version has more than {LOW_STOCK} in stock.</EmptyNote>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-ink/[0.05] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-ink">{title}</h2>
        <Link
          href={href}
          className="group inline-flex items-center gap-1 text-sm font-medium text-link transition-colors hover:text-link-hover"
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function EmptyNote({ children, icon = false }: { children: React.ReactNode; icon?: boolean }) {
  return (
    <p className="flex items-center gap-2 py-6 text-sm text-ink-2">
      {icon && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
      {children}
    </p>
  );
}
