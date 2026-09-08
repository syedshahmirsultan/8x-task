"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { saveOrder } from "@/lib/orders-store";

const SHIPPING_FLAT_RATE = 499; // cents — placeholder until real shipping rules exist

function generateOrderId() {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalCount, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-gray-600">
          Add something to your cart before checking out.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block cursor-pointer rounded-md bg-accent-buy px-6 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-accent-buy-hover"
        >
          Continue Shopping
        </Link>
      </main>
    );
  }

  const total = subtotal + SHIPPING_FLAT_RATE;

  function handlePlaceOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const orderId = generateOrderId();
    saveOrder({
      id: orderId,
      date: new Date().toISOString(),
      status: "Processing",
      items: items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      })),
      total,
    });
    clearCart();
    router.push(`/checkout/confirmation?orderId=${orderId}&total=${(total / 100).toFixed(2)}`);
  }

  return (
    <main id="main-content" className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <form onSubmit={handlePlaceOrder} className="space-y-6">
        <section className="rounded-lg border border-border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Shipping address</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Full name" className="input-field sm:col-span-2" />
            <input required placeholder="Address line 1" className="input-field sm:col-span-2" />
            <input placeholder="Address line 2 (optional)" className="input-field sm:col-span-2" />
            <input required placeholder="City" className="input-field" />
            <input required placeholder="State / Province" className="input-field" />
            <input required placeholder="ZIP / Postal code" className="input-field" />
            <input required type="tel" placeholder="Phone number" className="input-field" />
          </div>
        </section>

        <section className="rounded-lg border border-border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Payment method</h2>
          <p className="mb-3 text-xs text-gray-500">
            Test mode — no real payment is processed. Card fields are a UI
            placeholder until Stripe test-mode checkout is wired up.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Card number"
              inputMode="numeric"
              className="input-field sm:col-span-2"
            />
            <input required placeholder="MM / YY" className="input-field" />
            <input required placeholder="CVC" className="input-field" />
          </div>
        </section>

        <button
          type="submit"
          className="w-full cursor-pointer rounded-full bg-accent-cart py-3 text-sm font-semibold text-brand transition-colors hover:bg-accent-cart-hover sm:w-auto sm:px-8"
        >
          Place your order
        </button>
      </form>

      <aside className="h-fit space-y-3 rounded-lg border border-border bg-white p-4">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <ul className="space-y-1 text-sm text-gray-600">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="line-clamp-1">
                {item.title} × {item.quantity}
              </span>
              <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <span>Items ({totalCount}):</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping:</span>
            <span>{formatPrice(SHIPPING_FLAT_RATE)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-price">
            <span>Order total:</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
