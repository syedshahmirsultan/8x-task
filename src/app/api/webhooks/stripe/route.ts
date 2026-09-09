import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    // Order creation happens here, not in the client after form submit —
    // this is the one place we know payment actually succeeded.
    if (userId) {
      const orderId = `ORD-${session.id.slice(-12).toUpperCase()}`;

      const insertedOrder = await db
        .insert(orders)
        .values({
          id: orderId,
          userId,
          stripeSessionId: session.id,
          status: "Processing",
          total: session.amount_total ?? 0,
        })
        // Stripe can redeliver the same event — the unique stripeSessionId
        // makes this idempotent instead of creating duplicate orders.
        .onConflictDoNothing()
        .returning({ id: orders.id });

      // Only insert items if the order itself was newly created — otherwise
      // a retried webhook would duplicate line items under the same order.
      if (insertedOrder.length > 0) {
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items.data.price.product"],
        });
        const items = fullSession.line_items?.data ?? [];

        if (items.length > 0) {
          await db.insert(orderItems).values(
            items.map((item, index) => {
              const product = item.price?.product;
              const image =
                product && typeof product === "object" && "images" in product
                  ? (product.images?.[0] ?? "")
                  : "";
              return {
                id: `${orderId}-${index}`,
                orderId,
                title: item.description ?? "Item",
                quantity: item.quantity ?? 1,
                price: item.price?.unit_amount ?? 0,
                image,
              };
            }),
          );
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
