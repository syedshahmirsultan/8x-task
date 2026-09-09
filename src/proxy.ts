import { clerkMiddleware } from "@clerk/nextjs/server";

// Named `proxy.ts` per Next.js 16's rename of Middleware to Proxy — the
// underlying request/response handling is unchanged, only the file
// convention and export name (`proxy` or default) differ.
//
// clerkMiddleware() just needs to run globally so `auth()`/`auth.protect()`
// work in pages/layouts — actual route protection is resource-based, done
// via `await auth.protect()` in each protected page (checkout, account,
// account/orders) rather than path-matching here. Clerk's own guidance:
// path matching can diverge from how Next.js actually routes requests and
// leave protected resources reachable.
export default clerkMiddleware();

export const config = {
  matcher: [
    // /api/webhooks/* is deliberately excluded: Stripe's signature is
    // computed over the exact raw request bytes, and running any
    // middleware in front of that route risks altering them before the
    // handler reads the body — even middleware that never touches it.
    "/((?!_next|api/webhooks|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
