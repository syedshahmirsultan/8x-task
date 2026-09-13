import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import type Stripe from "stripe";
import { ClearCartOnLoad } from "./clear-cart-on-load";
import { ReviewPromptModal } from "./review-prompt-modal";
import { formatPrice } from "@/lib/format";
import { parseSearchParam } from "@/lib/product-filters";
import { getProductSlugsByIds } from "@/lib/products";
import { stripe } from "@/lib/stripe";

export default async function CheckoutConfirmationPage(
  props: PageProps<"/checkout/confirmation">,
) {
  const searchParams = await props.searchParams;
  const sessionId = parseSearchParam(searchParams.session_id);

  if (!sessionId) {
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

  // The redirect here confirms Stripe accepted payment; the actual order
  // record is created separately by the webhook (see
  // /api/webhooks/stripe), which is the only place we're certain payment
  // truly succeeded rather than just that the browser was redirected here.
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product"],
  });
  const paid = session.payment_status === "paid";

  // Read straight from this Stripe session rather than waiting on the
  // webhook-created order — the review prompt needs to show immediately on
  // this page, not "in a few seconds" once our DB catches up.
  const purchasedItems: { title: string; slug: string; image: string }[] = [];
  if (paid) {
    const lineItems = session.line_items?.data ?? [];
    const withProductIds = lineItems
      .map((item) => {
        const product = item.price?.product;
        const isExpanded = product && typeof product === "object" && "metadata" in product;
        return isExpanded
          ? {
              productId: (product as Stripe.Product).metadata?.productId,
              title: item.description ?? "Item",
              image: (product as Stripe.Product).images?.[0] ?? "",
            }
          : null;
      })
      .filter((item): item is { productId: string; title: string; image: string } =>
        Boolean(item?.productId),
      );

    const slugsById = await getProductSlugsByIds(withProductIds.map((item) => item.productId));
    for (const item of withProductIds) {
      const slug = slugsById.get(item.productId);
      if (slug) purchasedItems.push({ title: item.title, slug, image: item.image });
    }
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
      {paid && <ClearCartOnLoad />}
      {paid && <ReviewPromptModal items={purchasedItems} />}

      {paid ? (
        <>
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
          <h1 className="mt-4 text-2xl font-semibold">Order placed, thank you!</h1>
          <p className="mt-2 text-sm text-gray-600">
            Total <span className="font-semibold">{formatPrice(session.amount_total ?? 0)}</span>
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs text-gray-500">
            Test mode — no real payment was processed. Your order will appear
            in your order history in a few seconds.
          </p>
        </>
      ) : (
        <>
          <XCircle className="mx-auto h-14 w-14 text-price" />
          <h1 className="mt-4 text-2xl font-semibold">Payment not completed</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your card wasn&apos;t charged. You can try again from your cart.
          </p>
        </>
      )}

      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/products"
          className="cursor-pointer rounded-md bg-accent-buy px-6 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-accent-buy-hover"
        >
          Continue Shopping
        </Link>
        {paid && (
          <Link
            href="/account/orders"
            className="cursor-pointer rounded-md border border-border px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-background"
          >
            View Orders
          </Link>
        )}
      </div>
    </main>
  );
}
