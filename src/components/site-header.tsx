"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Menu, Package, Search, ShoppingCart, User, X } from "lucide-react";
import { CartBadge } from "@/components/cart-badge";
import { HeaderSearch } from "@/components/header-search";
import { Logo } from "@/components/logo";
import type { Category } from "@/data/types";

export interface HeaderCategory extends Category {
  productCount: number;
}

/** Scrolled this far before the bar may hide on scroll-down — ignores jitter at the top. */
const HIDE_AFTER_PX = 120;
/** Lets the pointer cross the gap from "Shop" into the panel without it closing. */
const CLOSE_GRACE_MS = 140;

export function SiteHeader({
  categories,
  account,
}: {
  categories: HeaderCategory[];
  account: { firstName: string | null } | null;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastY = useRef(0);

  // Close every overlay on navigation. Adjusting state during render (rather
  // than in an effect) avoids a flash of the old menu on the new page.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setShopOpen(false);
    setDrawerOpen(false);
    setMobileSearchOpen(false);
  }

  useEffect(() => {
    lastY.current = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      setScrolled(y > 8);
      setHidden(y > lastY.current && y > HIDE_AFTER_PX);
      lastY.current = y;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable='true']");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        setHidden(false);
        if (window.matchMedia("(min-width: 768px)").matches) searchRef.current?.focus();
        else setMobileSearchOpen(true);
      } else if (event.key === "Escape") {
        setShopOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  function openShop() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShopOpen(true);
  }
  function closeShopSoon() {
    closeTimer.current = setTimeout(() => setShopOpen(false), CLOSE_GRACE_MS);
  }

  const overlayOpen = shopOpen || drawerOpen || mobileSearchOpen;
  const accountHref = account ? "/account" : "/sign-in";
  const accountLabel = account ? (account.firstName ? `Hi, ${account.firstName}` : "Account") : "Sign in";

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-transform duration-300 ease-(--ease-out) motion-reduce:transition-none ${
          hidden && !overlayOpen ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div
          className={`relative bg-brand text-white transition-shadow duration-300 ${
            scrolled ? "shadow-[0_10px_30px_-18px_rgb(19_25_33/0.8)]" : ""
          }`}
        >
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:h-[4.5rem] lg:gap-4">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="-ml-2 grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-white/10 lg:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={2} />
            </button>

            <Logo className="shrink-0" />

            <nav aria-label="Primary" className="ml-4 hidden shrink-0 items-center gap-0.5 lg:flex">
              <div onMouseEnter={openShop} onMouseLeave={closeShopSoon}>
                <button
                  type="button"
                  onClick={() => setShopOpen((open) => !open)}
                  aria-expanded={shopOpen}
                  aria-controls="shop-panel"
                  className={`flex h-10 cursor-pointer items-center gap-1 rounded-full px-3.5 text-sm font-medium transition-colors hover:bg-white/10 ${
                    shopOpen ? "bg-white/10" : ""
                  }`}
                >
                  Shop
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${shopOpen ? "rotate-180" : ""}`}
                    strokeWidth={2}
                  />
                </button>
              </div>
              <NavLink href="/products" active={pathname === "/products"}>
                All products
              </NavLink>
              <NavLink href="/products?maxPrice=50">Under $50</NavLink>
            </nav>

            <div className="mx-auto hidden w-full max-w-md md:block lg:max-w-lg">
              <HeaderSearch ref={searchRef} categories={categories} />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-0.5 md:ml-0">
              <button
                type="button"
                onClick={() => setMobileSearchOpen((open) => !open)}
                aria-label={mobileSearchOpen ? "Close search" : "Search products"}
                aria-expanded={mobileSearchOpen}
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-white/10 md:hidden"
              >
                {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" strokeWidth={2} />}
              </button>

              <Link
                href={accountHref}
                className="hidden h-11 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors hover:bg-white/10 sm:flex"
              >
                <User className="h-5 w-5" strokeWidth={2} />
                <span className="hidden max-w-32 truncate xl:inline">{accountLabel}</span>
              </Link>

              <Link
                href="/account/orders"
                className="hidden h-11 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors hover:bg-white/10 xl:flex"
              >
                <Package className="h-5 w-5" strokeWidth={2} />
                Orders
              </Link>

              <Link
                href="/cart"
                aria-label="Cart"
                className="relative grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-white/10"
              >
                <ShoppingCart className="h-[1.35rem] w-[1.35rem]" strokeWidth={2} />
                <CartBadge />
              </Link>
            </div>
          </div>

          {mobileSearchOpen && (
            <div className="animate-dropdown-in px-4 pb-3 md:hidden">
              <HeaderSearch categories={categories} autoFocus />
            </div>
          )}

          <ShopPanel open={shopOpen} categories={categories} onEnter={openShop} onLeave={closeShopSoon} />
        </div>
      </header>

      {/* Dims the page while the Shop panel is open, so it reads as a layer. */}
      <div
        aria-hidden="true"
        onClick={() => setShopOpen(false)}
        className={`fixed inset-0 z-30 bg-ink/30 transition-opacity duration-300 ${
          shopOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        accountHref={accountHref}
        accountLabel={accountLabel}
      />
    </>
  );
}

function NavLink({ href, active = false, children }: { href: string; active?: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-10 items-center rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors hover:bg-white/10 ${
        active ? "text-white" : "text-white/80 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

function ShopPanel({
  open,
  categories,
  onEnter,
  onLeave,
}: {
  open: boolean;
  categories: HeaderCategory[];
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      id="shop-panel"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      inert={!open}
      className={`absolute inset-x-0 top-full hidden bg-white text-ink shadow-[0_24px_48px_-24px_rgb(19_25_33/0.35)] transition-[opacity,transform] duration-300 ease-(--ease-out) lg:block ${
        open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
      }`}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_16rem] gap-8 px-6 py-7">
        <ul className="grid grid-cols-3 gap-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/category/${category.slug}`}
                className="group flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-paper-2"
              >
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface">
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover transition-transform duration-500 ease-(--ease-out) group-hover:scale-105"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.95rem] font-semibold">{category.name}</span>
                  <span className="text-xs text-muted tabular-nums">
                    {category.productCount} {category.productCount === 1 ? "product" : "products"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/products"
          className="group flex flex-col justify-between rounded-2xl bg-brand p-6 text-white transition-transform duration-300 ease-(--ease-out) hover:-translate-y-0.5"
        >
          <span className="text-2xl leading-tight font-semibold tracking-tight">Browse the whole collection</span>
          <span className="mt-6 flex items-center gap-2 text-sm font-medium text-accent">
            All products
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
    </div>
  );
}

function MobileDrawer({
  open,
  onClose,
  categories,
  accountHref,
  accountLabel,
}: {
  open: boolean;
  onClose: () => void;
  categories: HeaderCategory[];
  accountHref: string;
  accountLabel: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} inert={!open}>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-(--ease-out) ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between bg-brand px-4 text-white">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-2 text-xs font-medium text-muted">Shop by category</p>
          <ul className="space-y-1">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-paper-2"
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface">
                    <Image src={category.image} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                  <span className="text-[0.95rem] font-semibold text-ink">{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-1 border-t border-line pt-4 text-sm font-medium text-ink">
            <DrawerLink href="/products">All products</DrawerLink>
            <DrawerLink href="/products?maxPrice=50">Under $50</DrawerLink>
            <DrawerLink href="/account/orders">Orders</DrawerLink>
            <DrawerLink href={accountHref}>{accountLabel}</DrawerLink>
          </div>
        </div>
      </aside>
    </div>
  );
}

function DrawerLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="flex h-11 items-center rounded-full px-3 hover:bg-paper-2">
      {children}
    </Link>
  );
}
