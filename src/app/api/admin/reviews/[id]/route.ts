import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { deleteReview } from "@/lib/reviews";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/reviews/[id]">) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { id } = await ctx.params;
  await deleteReview(id);
  return NextResponse.json({ success: true });
}
