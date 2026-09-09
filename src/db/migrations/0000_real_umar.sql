CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"image" text NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"label" text NOT NULL,
	"options" jsonb NOT NULL,
	"price" integer NOT NULL,
	"stock" integer NOT NULL,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"brand" text NOT NULL,
	"category_id" text NOT NULL,
	"price" integer NOT NULL,
	"compare_at_price" integer,
	"images" text[] NOT NULL,
	"description" text NOT NULL,
	"bullets" text[] NOT NULL,
	"rating" real NOT NULL,
	"review_count" integer NOT NULL,
	"stock" integer NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;