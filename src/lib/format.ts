/** Formats integer cents as a localized currency string, e.g. 17999 -> "$179.99". */
export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
