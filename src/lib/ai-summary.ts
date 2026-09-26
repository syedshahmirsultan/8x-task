import "server-only";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { formatPrice } from "@/lib/format";
import type { Review } from "@/lib/reviews";
import type { Product } from "@/data/types";

/**
 * Generated fresh on every request from the product's current row and its
 * current reviews — deliberately not cached. A cache keyed on review count
 * served stale text whenever a review was deleted and another added (same
 * count, different content), and never noticed admin edits to price or
 * description at all. It only runs when a shopper clicks "Generate
 * Summary", so the cost of always regenerating is small.
 */
export async function generateProductSummary(
  product: Product,
  productReviews: Review[],
): Promise<string | null> {
  const reviewsBlock =
    productReviews.length > 0
      ? productReviews
          .slice(0, 20)
          .map((r) => `- ${r.rating}/5 "${r.title}": ${r.body}`)
          .join("\n")
      : "(No customer reviews yet.)";

  const variantPrices = product.variants?.length
    ? `\nOptions: ${product.variants.map((v) => `${v.label} (${formatPrice(v.price)})`).join(", ")}`
    : "";

  const prompt = `Product: ${product.title} by ${product.brand}
Price: ${formatPrice(product.price)}${variantPrices}
Description: ${product.description}
Key features: ${product.bullets.join("; ")}

Customer reviews:
${reviewsBlock}

Write a short, honest 2-3 sentence summary for a shopper deciding whether to buy this. Blend the product's own description with what reviewers actually say (if any reviews exist) — call out genuine praise and any recurring complaints. Only mention reviews listed above; if there are none, don't imply there are. Plain prose, no markdown, no bullet points, no headings.`;

  try {
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      prompt,
    });
    return text.trim() || null;
  } catch {
    // AI summary is a nice-to-have — the PDP works fine without it.
    return null;
  }
}
