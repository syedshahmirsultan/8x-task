import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import type { Category } from "@/data/types";

export async function getAllCategories(): Promise<Category[]> {
  return db.select().from(categories);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const [row] = await db.select().from(categories).where(eq(categories.slug, slug));
  return row;
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  const [row] = await db.select().from(categories).where(eq(categories.id, id));
  return row;
}
