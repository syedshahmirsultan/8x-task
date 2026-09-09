import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const matches = await searchProducts(q);

  return NextResponse.json({
    results: matches.slice(0, 6).map((product) => ({
      slug: product.slug,
      title: product.title,
      image: product.images[0],
      price: product.price,
    })),
  });
}
