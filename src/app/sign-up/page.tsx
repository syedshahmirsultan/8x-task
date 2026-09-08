import Link from "next/link";

export default function SignUpPage() {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-lg border border-border bg-white p-6">
        <h1 className="text-xl font-semibold">Create account</h1>
        <form className="mt-4 space-y-3">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Full name
            </label>
            <input id="name" placeholder="Jane Doe" className="input-field" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input id="email" type="email" placeholder="you@example.com" className="input-field" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              Password
            </label>
            <input id="password" type="password" placeholder="••••••••" className="input-field" />
          </div>
          <button
            type="button"
            disabled
            title="Authentication isn't wired up yet"
            className="w-full cursor-not-allowed rounded-full bg-accent-cart py-2.5 text-sm font-semibold text-brand opacity-50"
          >
            Create your account
          </button>
          <p className="text-center text-xs text-gray-500">
            Sign-up isn&apos;t wired up yet — this is a UI placeholder for the
            authentication phase.
          </p>
        </form>
      </div>
      <p className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="cursor-pointer text-link hover:text-link-hover hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
