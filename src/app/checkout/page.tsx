import { auth } from "@clerk/nextjs/server";
import { CheckoutForm } from "./checkout-form";

// Resource-based protection (Clerk's current recommendation over
// middleware path-matching, see src/proxy.ts) — checked right where the
// protected data is actually used.
export default async function CheckoutPage() {
  await auth.protect();
  return <CheckoutForm />;
}
