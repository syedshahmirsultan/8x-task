import Link from "next/link";

export default function AccountPage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-sm flex-1 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">You&apos;re not signed in</h1>
      <p className="mt-2 text-sm text-gray-600">
        Sign in to view your orders, addresses, and account details.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/sign-in"
          className="cursor-pointer rounded-full bg-accent-cart py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-accent-cart-hover"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="cursor-pointer rounded-full border border-border py-2.5 text-sm font-semibold transition-colors hover:bg-background"
        >
          Create an Account
        </Link>
      </div>
    </main>
  );
}
