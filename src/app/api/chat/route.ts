import { groq } from "@ai-sdk/groq";
import { auth } from "@clerk/nextjs/server";
import { convertToModelMessages, smoothStream, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { getAllCategories, getCategoryBySlug } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import { getOrdersByUserId } from "@/lib/orders";
import { getAllProducts, getProductBySlug, getProductsByCategory, searchProducts } from "@/lib/products";

const SYSTEM_PROMPT = `You are Kartify's shopping assistant, embedded as a chat widget on every page of the store.

You have full, authoritative knowledge of the Kartify catalog through your tools — every product, category, price, and stock level is reachable this way. Never invent a product, price, or stock status; if a tool returns nothing relevant, say so honestly. Use search_products liberally, including with no query at all, whenever the user wants to browse, see what's available, or asks anything about "everything you have" — it's not just for keyword search.

Keep replies short and conversational — a few sentences, not a report. When listing products, mention 2-4 by name with their price, not a long list. Prices from tools are already formatted (e.g. "$29.99") — just use them as-is, don't recompute. When a tool result includes an image, it will be shown to the user automatically in the UI — don't describe the image in words or paste the URL into your reply. You may wrap product names and prices in **double asterisks** to emphasize them — it renders as bold text, not literal asterisks — but don't overuse it. search_products returns a totalCount field with the true number of matches — if the user asks how many products exist or match, state that number directly. Never count the list yourself or guess, since you're unreliable at counting long lists.

If the user isn't signed in and asks about their orders, tell them they need to sign in first rather than guessing.

Shopping flow: use add_to_cart when the user wants to add a product to their cart, view_cart to show what's in it, and remove_from_cart to take something out. When the user is ready to pay or asks to check out, call start_checkout — it will tell you whether they need to sign up first or hand back a checkout link; the UI shows the actual button, so just briefly tell them what to do next (e.g. "sign up to continue" or "click below to complete your purchase") without repeating the link or button as text.

remove_from_cart needs the exact lineId from a recent view_cart or add_to_cart result — never guess one (e.g. from a product slug or name). If you don't already have the right lineId from earlier in this conversation, call view_cart first to get it, then call remove_from_cart. It never removes anything itself — it shows the user a Yes/No confirmation button in the UI, and only that click actually removes the item. You will not find out whether they confirmed or cancelled, so after calling it just say something like "Sure — confirm below and I'll remove it" and stop there. Never describe the cart's contents or subtotal after a remove_from_cart call, since you don't actually know the outcome yet; if the user then asks to see their cart, call view_cart fresh to get the real state instead of guessing or doing the math yourself.`;

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
    stopWhen: stepCountIs(5),
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
            results = results.filter((p) => p.price <= maxPriceUsd * 100);
          }
          // totalCount reflects every match, even beyond the cap below — the
          // model reads this number directly instead of counting list items
          // itself, which large language models do unreliably. The cap here
          // is generously above the current catalog size (15 products) so a
          // "show me everything" browse actually returns everything; revisit
          // it if the catalog grows substantially.
          return {
            totalCount: results.length,
            products: results.slice(0, 24).map((p) => ({
              slug: p.slug,
              title: p.title,
              brand: p.brand,
              price: formatPrice(p.price),
              rating: p.rating,
              inStock: p.stock > 0,
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
          if (!product) return { error: "No product found with that slug." };
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
