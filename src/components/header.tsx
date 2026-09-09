import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Menu, Search, ShoppingCart, User } from "lucide-react";
import { CartBadge } from "@/components/cart-badge";
import { Logo } from "@/components/logo";
import { SearchInput } from "@/components/search-input";
import { StickyHeaderShell } from "@/components/sticky-header-shell";
import { getAllCategories } from "@/lib/categories";

export async function Header() {
  const [categories, user] = await Promise.all([getAllCategories(), currentUser()]);
  const firstName = user?.firstName;

  return (
    <StickyHeaderShell>
      <div className="flex items-center gap-3 bg-brand px-4 py-3 sm:gap-4">
        <Logo className="shrink-0" />

        <form
          action="/search"
          className="hidden flex-1 rounded-md ring-accent-buy transition-shadow focus-within:ring-2 sm:flex"
        >
          <label htmlFor="category" className="sr-only">
            Search category
          </label>
          <select
            id="category"
            name="category"
            className="cursor-pointer rounded-l-md border-r border-border bg-gray-100 px-3 text-base text-brand focus:outline-none"
            defaultValue=""
          >
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <SearchInput
            id="search-q"
            className="w-full bg-white px-4 py-3 text-base text-brand focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex cursor-pointer items-center rounded-r-md bg-accent-buy px-5 transition-colors hover:bg-accent-buy-hover"
          >
            <Search className="h-5 w-5 text-brand" />
          </button>
        </form>

        <nav className="flex shrink-0 items-center gap-4 text-sm text-white">
          <Show
            when="signed-in"
            fallback={
              <Link
                href="/sign-in"
                className="hidden rounded-sm px-1 py-1 hover:outline hover:outline-white sm:block"
              >
                <span className="block text-xs text-gray-300">Hello, sign in</span>
                <span className="font-semibold">Account &amp; Lists</span>
              </Link>
            }
          >
            <Link
              href="/account"
              className="hidden rounded-sm px-1 py-1 hover:outline hover:outline-white sm:block"
            >
              <span className="block text-xs text-gray-300">
                Hello, {firstName ?? "there"}
              </span>
              <span className="font-semibold">Account &amp; Lists</span>
            </Link>
          </Show>
          <Link
            href="/account/orders"
            className="hidden rounded-sm px-1 py-1 hover:outline hover:outline-white md:block"
          >
            <span className="block text-xs text-gray-300">Returns</span>
            <span className="font-semibold">&amp; Orders</span>
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="flex items-end gap-1 rounded-sm px-1 py-1 hover:outline hover:outline-white"
          >
            <span className="relative">
              <ShoppingCart className="h-7 w-7" />
              <CartBadge />
            </span>
            <span className="hidden font-semibold sm:inline">Cart</span>
          </Link>
        </nav>
      </div>

      <form
        action="/search"
        className="flex bg-brand px-4 pb-3 ring-accent-buy transition-shadow focus-within:ring-2 sm:hidden"
      >
        <SearchInput
          id="search-q-mobile"
          className="w-full rounded-l-md bg-white px-4 py-3 text-base text-brand focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex cursor-pointer items-center rounded-r-md bg-accent-buy px-5 transition-colors hover:bg-accent-buy-hover"
        >
          <Search className="h-5 w-5 text-brand" />
        </button>
      </form>

      <div className="flex items-center gap-4 overflow-x-auto bg-brand-secondary px-4 py-2 text-sm whitespace-nowrap text-white">
        <Link
          href="/products"
          className="flex shrink-0 items-center gap-1 font-semibold hover:underline"
        >
          <Menu className="h-4 w-4" /> All
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="shrink-0 hover:underline"
          >
            {category.name}
          </Link>
        ))}
        <Show
          when="signed-in"
          fallback={
            <Link
              href="/sign-in"
              className="ml-auto flex shrink-0 items-center gap-1 hover:underline sm:hidden"
            >
              <User className="h-4 w-4" /> Sign in
            </Link>
          }
        >
          <Link
            href="/account"
            className="ml-auto flex shrink-0 items-center gap-1 hover:underline sm:hidden"
          >
            <User className="h-4 w-4" /> Account
          </Link>
        </Show>
      </div>
    </StickyHeaderShell>
  );
}
