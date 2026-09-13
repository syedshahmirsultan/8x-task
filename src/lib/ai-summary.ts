import "server-only";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { formatPrice } from "@/lib/format";
import { getCachedAiSummary, saveAiSummary } from "@/lib/products";
import type { Review } from "@/lib/reviews";
import type { Product } from "@/data/types";

/**
 * Cached in the products table, keyed by review count — regenerated only
 * when a new review actually changes the count, not on every page view.
 */
export async function getOrGenerateProductSummary(
  product: Product,
  productReviews: Review[],
): Promise<string | null> {
  const cached = await getCachedAiSummary(product.id);
  if (cached?.aiSummary && cached.aiSummaryReviewCount === productReviews.length) {
    return cached.aiSummary;
  }

  const reviewsBlock =
    productReviews.length > 0
      ? productReviews
          .slice(0, 20)
          .map((r) => `- ${r.rating}/5 "${r.title}": ${r.body}`)
          .join("\n")
      : "(No customer reviews yet.)";

  const prompt = `Product: ${product.title} by ${product.brand}
Price: ${formatPrice(product.price)}
Description: ${product.description}
Key features: ${product.bullets.join("; ")}

Customer reviews:
${reviewsBlock}

Write a short, honest 2-3 sentence summary for a shopper deciding whether to buy this. Blend the product's own description with what reviewers actually say (if any reviews exist) — call out genuine praise and any recurring complaints. Plain prose, no markdown, no bullet points, no headings.`;

  try {
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      prompt,
    });
    const summary = text.trim();
    if (summary) await saveAiSummary(product.id, summary, productReviews.length);
    return summary || null;
  } catch {
    // AI summary is a nice-to-have — the PDP works fine without it.
    return cached?.aiSummary ?? null;
  }
}
