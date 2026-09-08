import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { parseSearchParam } from "@/lib/product-filters";

export default async function CheckoutConfirmationPage(
  props: PageProps<"/checkout/confirmation">,
) {
  const searchParams = await props.searchParams;
  const orderId = parseSearchParam(searchParams.orderId);
  const total = parseSearchParam(searchParams.total);

  if (!orderId) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">No recent order found</h1>
        <Link
          href="/products"
          className="mt-6 inline-block cursor-pointer rounded-md bg-accent-buy px-6 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-accent-buy-hover"
        >
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
      <h1 className="mt-4 text-2xl font-semibold">Order placed, thank you!</h1>
      <p className="mt-2 text-sm text-gray-600">
        Confirmation for order <span className="font-semibold">{orderId}</span>
        {total && (
          <>
            {" "}
            — total <span className="font-semibold">${total}</span>
          </>
        )}
      </p>
      <p className="mx-auto mt-2 max-w-md text-xs text-gray-500">
        This is a demo checkout — no real payment was processed and no email
        will be sent.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/products"
          className="cursor-pointer rounded-md bg-accent-buy px-6 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-accent-buy-hover"
        >
          Continue Shopping
        </Link>
        <Link
          href="/account/orders"
          className="cursor-pointer rounded-md border border-border px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-background"
        >
          View Orders
        </Link>
      </div>
    </main>
  );
}
