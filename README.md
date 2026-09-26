# Kartify

A small online store inspired by Amazon's shopping flow, redesigned with its own look. Shoppers can browse, search, filter, read AI summaries, chat with a shopping assistant, and pay with Stripe. An admin panel manages the catalog and orders.

## Tech stack

| What | Used for |
| --- | --- |
| [Next.js 16](https://nextjs.org) (App Router) + TypeScript | The whole app: pages and API |
| Tailwind CSS v4 | Styling |
| Neon Postgres + [Drizzle ORM](https://orm.drizzle.team) | Database (products, orders, reviews) |
| [Clerk](https://clerk.com) | Customer sign-in |
| [Stripe](https://stripe.com) (test mode) | Checkout and payments |
| [Groq](https://groq.com) via the Vercel AI SDK | AI product summaries and the chat assistant |

## Getting started

1. **Install packages**

   ```bash
   npm install
   ```

2. **Add your keys.** Create a `.env.local` file in the project root:

   ```bash
   DATABASE_URL=                        # Neon Postgres connection string
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=               # from `stripe listen` (see below)
   GROQ_API_KEY=                        # AI summary + chat assistant
   SITE_URL=http://localhost:3000
   ADMIN_EMAILS=you@example.com         # comma-separated
   ADMIN_PASSWORD=                      # password for /admin
   ```

3. **Set up the database**

   ```bash
   npm run db:migrate   # create the tables
   npm run db:seed      # add the starter catalog (safe to re-run)
   ```

4. **Run it**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). The admin panel is at [/admin](http://localhost:3000/admin).

5. **(Optional) Test payments locally.** Stripe tells the app about finished payments through a webhook. This creates the order and lowers stock. Forward it to your machine with the [Stripe CLI](https://stripe.com/docs/stripe-cli):

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Pay with the test card `4242 4242 4242 4242`, any future date, any CVC.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | Check the code with ESLint |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to the database |
| `npm run db:seed` | Load the starter catalog into an empty database |
| `npm run db:studio` | Browse the database in your browser |

## Project structure

```
src/
├── app/                  Pages and API routes (each folder = a URL)
│   ├── page.tsx          Home page
│   ├── products/         All products (/products) and product pages (/products/[slug])
│   ├── category/[slug]/  One category
│   ├── search/           Search results
│   ├── cart/  checkout/  Cart and Stripe checkout
│   ├── account/          Customer account and order history
│   ├── admin/            Admin panel: overview, products, categories, orders, reviews
│   ├── api/              Server endpoints
│   │   ├── chat/         Shopping assistant (AI + tools that read the catalog)
│   │   ├── products/     AI summary and reviews for a product
│   │   ├── checkout/     Starts a Stripe checkout
│   │   ├── webhooks/     Stripe webhook: creates orders, lowers stock
│   │   ├── admin/        Admin actions (save products, upload images, …)
│   │   └── images/       Serves images uploaded in the admin panel
│   ├── layout.tsx        Wraps every page (header, footer, chat, toasts)
│   └── globals.css       Theme colours, fonts and animations
│
├── components/           Reusable UI pieces
│   ├── site-header.tsx   Navbar, Shop menu, search bar
│   ├── hero-carousel.tsx Auto-playing home hero
│   ├── product-card.tsx  The product tile used everywhere
│   ├── product-browser.tsx  Filters, sorting and grid for listing pages
│   ├── product-*.tsx     Product page parts (gallery, options, reviews, AI summary)
│   ├── chat-widget.tsx   The shopping assistant window
│   └── admin/            Admin panel parts
│
├── lib/                  Logic shared by pages (no UI)
│   ├── products.ts       Read and write products in the database
│   ├── search.ts         Forgiving product search (typos, plurals, synonyms)
│   ├── ai-summary.ts     Generates the AI summary from live data
│   ├── cart-context.tsx  Cart state (kept in the browser)
│   └── …                 Orders, reviews, categories, admin auth, formatting
│
├── db/                   Database
│   ├── schema.ts         Table definitions
│   ├── migrations/       Generated SQL migrations
│   ├── catalog.ts        Starter products used by `db:seed`
│   └── seed.ts           The seed script
│
├── data/types.ts         Shared TypeScript types (Product, Order, …)
└── proxy.ts              Runs Clerk on every request (Next.js 16's "middleware")
```

## How it works

- **Products live in the database.** Pages always read from Postgres. Adding or editing a product in the admin panel shows up on the store immediately. `src/db/catalog.ts` only fills an empty database.
- **The AI summary is generated live.** "Summarize" sends the product's current details and reviews to the AI. Nothing is cached, so the summary always reflects the latest data.
- **The assistant uses the real catalog.** It calls tools that search products, read details, check orders, and manage the cart. It never makes products up.
- **Stock updates after payment.** When Stripe confirms a payment, the webhook saves the order and lowers stock for the exact version bought.
- **The admin panel is password-protected.** It uses `ADMIN_EMAILS` and `ADMIN_PASSWORD`, separately from customer sign-in.
