import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { productVariants, products } from "@/db/schema";
import { stripe } from "@/lib/stripe";

interface CheckoutRequestItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { items } = (await request.json()) as { items: CheckoutRequestItem[] };
  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Re-derive canonical price/title/image from the database for every line
  // — never trust price/title values sent by the client, since those are
  // just a cached snapshot the browser could have tampered with.
  const lineItems: Array<{
    price_data: {
      currency: string;
      product_data: { name: string; images: string[] };
      unit_amount: number;
    };
    quantity: number;
  }> = [];

  for (const item of items) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, item.productId),
    });
    if (!product) continue;

    let title = product.title;
    let price = product.price;
    let image = product.images[0];

    if (item.variantId) {
      const variant = await db.query.productVariants.findFirst({
        where: eq(productVariants.id, item.variantId),
      });
      if (variant) {
        title = `${product.title} (${variant.label})`;
        price = variant.price;
        image = variant.image ?? image;
      }
    }

    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: title, images: image ? [image] : [] },
        unit_amount: price,
      },
      quantity: Math.max(1, Math.floor(item.quantity)),
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "No valid items in cart" }, { status: 400 });
  }

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${siteUrl}/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout`,
    metadata: { userId },
  });

  return NextResponse.json({ url: session.url });
}
