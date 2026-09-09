import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";

// Resource-based protection (Clerk's current recommendation over
// middleware path-matching, see src/proxy.ts) — checked right where the
// protected data is actually used.
export default async function AccountPage() {
  await auth.protect();
  const user = await currentUser();

  return (
    <main id="main-content" className="mx-auto w-full max-w-sm flex-1 px-4 py-16 text-center">
      <div className="flex justify-center">
        <UserButton showName />
      </div>
      <h1 className="mt-4 text-xl font-semibold">
        Hello, {user?.firstName ?? "there"}
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        {user?.primaryEmailAddress?.emailAddress}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/account/orders"
          className="cursor-pointer rounded-full bg-accent-cart py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-accent-cart-hover"
        >
          Your Orders
        </Link>
        <Link
          href="/products"
          className="cursor-pointer rounded-full border border-border py-2.5 text-sm font-semibold transition-colors hover:bg-background"
        >
          Continue Shopping
        </Link>
      </div>
    </main>
  );
}
