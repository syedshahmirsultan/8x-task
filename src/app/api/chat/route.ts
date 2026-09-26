import { groq } from "@ai-sdk/groq";
import { auth } from "@clerk/nextjs/server";
import { convertToModelMessages, smoothStream, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { getAllCategories, getCategoryBySlug } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import { getOrdersByUserId } from "@/lib/orders";
import { getAllProducts, getProductBySlug, getProductsByCategory, searchProducts } from "@/lib/products";
import type { Product } from "@/data/types";

const SYSTEM_PROMPT = `You are Kartify's shopping assistant, embedded as a chat widget on every page of the store.

You have full, authoritative knowledge of the Kartify catalog through your tools — every product, category, price, and stock level is reachable this way. Never invent a product, price, or stock status.

How to find products reliably:
- Always look products up with your tools before answering a product question — never answer from memory or guess what the store carries.
- Search with the product's core noun, not the user's whole sentence: "I'm looking to buy a smart watch" → query "smartwatch". Search understands plurals, small typos and common synonyms (shoes → sneakers, phone → smartphone, perfume → fragrance).
- For vague or gift-style requests ("something for my dad", "a gift under $50", "what's good for the gym"), browse instead: call search_products with no query (optionally a categorySlug or maxPriceUsd) and recommend from what comes back.
- If a search returns no products, don't stop there. Retry once or twice with a broader or alternative word, or browse the most likely category. The tool also returns closest suggestions when nothing matches — offer those.
- Never reply with only "no products found" or "I can't find that". If the store genuinely doesn't carry something, say so in one short sentence and immediately suggest the closest things it does carry, or ask one clarifying question.
- Don't mention your tools, searches or retries to the user — just give the answer.

Use search_products liberally, including with no query at all, whenever the user wants to browse, see what's available, or asks anything about "everything you have" — it's not just for keyword search.

Keep replies short and conversational — a few sentences, not a report. When listing products, mention 2-4 by name with their price, not a long list. Match your wording to how many products you actually found — if there's one, say so ("Here's the laptop we carry"), never "a couple" or "some". Only mention products that fit what was asked; don't pad an answer with unrelated items. Prices from tools are already formatted (e.g. "$29.99") — just use them as-is, don't recompute. When a product has a priceRange, its versions differ in price — mention the range or the relevant version (e.g. for "cheapest" questions, the lowest-priced version). When a tool result includes an image, it will be shown to the user automatically in the UI — don't describe the image in words or paste the URL into your reply. You may wrap product names and prices in **double asterisks** to emphasize them — it renders as bold text, not literal asterisks — but don't overuse it. search_products returns a totalCount field with the true number of matches — if the user asks how many products exist or match, state that number directly. Never count the list yourself or guess, since you're unreliable at counting long lists.

If the user isn't signed in and asks about their orders, tell them they need to sign in first rather than guessing.

Shopping flow: use add_to_cart when the user wants to add a product to their cart, view_cart to show what's in it, and remove_from_cart to take something out. When the user is ready to pay or asks to check out, call start_checkout — it will tell you whether they need to sign up first or hand back a checkout link; the UI shows the actual button, so just briefly tell them what to do next (e.g. "sign up to continue" or "click below to complete your purchase") without repeating the link or button as text.

remove_from_cart needs the exact lineId from a recent view_cart or add_to_cart result — never guess one (e.g. from a product slug or name). If you don't already have the right lineId from earlier in this conversation, call view_cart first to get it, then call remove_from_cart. It never removes anything itself — it shows the user a Yes/No confirmation button in the UI, and only that click actually removes the item. You will not find out whether they confirmed or cancelled, so after calling it just say something like "Sure — confirm below and I'll remove it" and stop there. Never describe the cart's contents or subtotal after a remove_from_cart call, since you don't actually know the outcome yet; if the user then asks to see their cart, call view_cart fresh to get the real state instead of guessing or doing the math yourself.`;

/** "$49.99 – $129.99" when a product's versions differ in price, otherwise undefined. */
function priceRange(product: Product): string | undefined {
  const prices = product.variants?.map((v) => v.price) ?? [];
  if (prices.length < 2) return undefined;
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  return low === high ? undefined : `${formatPrice(low)} – ${formatPrice(high)}`;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  const { messages, priorContext }: { messages: UIMessage[]; priorContext?: string } = await request.json();
  const modelMessages = await convertToModelMessages(messages);

  // Each chat tab shows its own clean thread in the UI, but the model still
  // gets a digest of the user's other recent tabs so switching tabs doesn't
  // read as amnesia.
  const system = priorContext
    ? `${SYSTEM_PROMPT}\n\nContext from the user's other recent conversations in this chat widget (background only — don't repeat it verbatim, just stay consistent with anything relevant):\n${priorContext}`
    : SYSTEM_PROMPT;

  const result = streamText({
    model: groq("openai/gpt-oss-120b"),
    system,
    messages: modelMessages,
    // Room to retry a search with other words or browse a category before answering.
    stopWhen: stepCountIs(8),
    // Groq generates fast enough that whole replies can arrive in a single
    // network chunk, which reads as an instant pop-in rather than a stream.
    // This paces the text back out word by word so the UI actually streams.
    experimental_transform: smoothStream({ delayInMs: 25, chunking: "word" }),
    tools: {
      search_products: tool({
        description:
          "Search or browse the product catalog. Pass a keyword query to search, or omit/leave it empty to browse — the whole catalog, or one category when categorySlug is given. Optionally narrow by a maximum price. Use this for any 'find', 'browse', 'show me what you have', or 'compare' request.",
        inputSchema: z.object({
          query: z
            .string()
            .optional()
            .describe("Search keywords, e.g. 'wireless headphones'. Omit to browse instead of search."),
          categorySlug: z
            .string()
            .optional()
            .describe("Category slug to filter by, e.g. 'electronics' — call list_categories first if unsure"),
          maxPriceUsd: z.number().optional().describe("Maximum price in whole US dollars"),
        }),
        execute: async ({ query, categorySlug, maxPriceUsd }) => {
          const category = categorySlug ? await getCategoryBySlug(categorySlug) : undefined;
          let results = query?.trim()
            ? await searchProducts(query)
            : category
              ? await getProductsByCategory(category.id)
              : await getAllProducts();
          if (category && query?.trim()) {
            results = results.filter((p) => p.categoryId === category.id);
          }
          if (maxPriceUsd !== undefined) {
            // A product qualifies if it — or any of its versions — fits the budget.
            results = results.filter((p) =>
              [p.price, ...(p.variants ?? []).map((v) => v.price)].some((price) => price <= maxPriceUsd * 100),
            );
          }
          if (results.length === 0) {
            // Never hand the model a dead end: give it the closest things the
            // store does carry, and the categories, so it can recover.
            const [catalog, categories] = await Promise.all([getAllProducts(), getAllCategories()]);
            const pool = category ? catalog.filter((p) => p.categoryId === category.id) : catalog;
            const suggestions = (pool.length ? pool : catalog)
              .filter((p) => p.stock > 0 && (maxPriceUsd === undefined || p.price <= maxPriceUsd * 100))
              .slice(0, 6);
            return {
              totalCount: 0,
              products: [],
              note: "No exact match. Retry with a broader or different word, or browse a category. If the store truly doesn't carry it, say so briefly and recommend from `suggestions` instead.",
              suggestions: suggestions.map((p) => ({ slug: p.slug, title: p.title, price: formatPrice(p.price) })),
              categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
            };
          }
          // totalCount reflects every match, even beyond the cap below — the
          // model reads this number directly instead of counting list items
          // itself, which large language models do unreliably. The cap here
          // is generously above the current catalog size so a "show me
          // everything" browse actually returns everything; revisit it if the
          // catalog grows substantially.
          return {
            totalCount: results.length,
            products: results.slice(0, 24).map((p) => ({
              slug: p.slug,
              title: p.title,
              brand: p.brand,
              price: formatPrice(p.price),
              // Versions can be priced differently — give the real range so
              // "what's cheapest?" doesn't miss a cheaper version.
              priceRange: priceRange(p),
              rating: p.rating,
              inStock: p.stock > 0,
              versions: p.variants?.map((v) => `${v.label} (${formatPrice(v.price)}${v.stock > 0 ? "" : ", sold out"})`),
              image: p.images[0],
            })),
          };
        },
      }),

      get_product_details: tool({
        description:
          "Get full details for one specific product by its slug (from a prior search result) — description, bullet points, price, stock, variants, and image.",
        inputSchema: z.object({
          slug: z.string().describe("The product's URL slug, e.g. 'aurawave-noise-cancelling-headphones'"),
        }),
        execute: async ({ slug }) => {
          const product = await getProductBySlug(slug);
          // A wrong or invented slug shouldn't surface as an error in the chat —
          // tell the model to look the product up properly instead.
          if (!product) return { notFound: true, note: "Unknown slug — call search_products to find the right product first." };
          return {
            slug: product.slug,
            title: product.title,
            brand: product.brand,
            price: formatPrice(product.price),
            compareAtPrice: product.compareAtPrice ? formatPrice(product.compareAtPrice) : undefined,
            description: product.description,
            bullets: product.bullets,
            rating: product.rating,
            reviewCount: product.reviewCount,
            inStock: product.stock > 0,
            image: product.images[0],
            variants: product.variants?.map((v) => ({
              id: v.id,
              label: v.label,
              price: formatPrice(v.price),
              inStock: v.stock > 0,
              image: v.image,
            })),
          };
        },
      }),

      list_categories: tool({
        description: "List all product categories available in the store.",
        inputSchema: z.object({}),
        execute: async () => {
          const categories = await getAllCategories();
          return categories.map((c) => ({ slug: c.slug, name: c.name }));
        },
      }),

      get_order_history: tool({
        description: "Get the signed-in user's past orders — status, items, and totals.",
        inputSchema: z.object({}),
        execute: async () => {
          if (!userId) return { error: "Not signed in — ask the user to sign in to view their orders." };
          const orders = await getOrdersByUserId(userId);
          return orders.map((order) => ({
            id: order.id,
            date: order.date,
            status: order.status,
            total: formatPrice(order.total),
            items: order.items.map((item) => ({ title: item.title, quantity: item.quantity })),
          }));
        },
      }),

      view_cart: tool({
        description: "Show the user's current shopping cart — line items, quantities, and subtotal.",
        inputSchema: z.object({}),
      }),

      add_to_cart: tool({
        description: "Add a product (optionally a specific variant) to the user's cart.",
        inputSchema: z.object({
          slug: z.string().describe("The product's URL slug"),
          variantId: z.string().optional().describe("Specific variant id, if the product has variants"),
          quantity: z.number().optional().describe("How many to add, defaults to 1"),
        }),
      }),

      remove_from_cart: tool({
        description:
          "Ask to remove a line item from the user's cart. This only shows a Yes/No confirmation button — it does not remove anything by itself, and you won't learn whether the user confirmed.",
        inputSchema: z.object({
          lineId: z.string().describe("The cart line id, as returned by view_cart or add_to_cart"),
        }),
      }),

      start_checkout: tool({
        description:
          "Start checkout for the user's current cart. Returns whether the user must sign up first, or a checkout link to complete payment.",
        inputSchema: z.object({}),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
