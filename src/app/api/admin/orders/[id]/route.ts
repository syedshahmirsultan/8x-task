import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin";
import { updateOrderStatus } from "@/lib/orders";

const statusSchema = z.object({
  status: z.enum(["Processing", "Shipped", "Delivered"]),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/orders/[id]">) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { id } = await ctx.params;
  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  await updateOrderStatus(id, parsed.data.status);
  return NextResponse.json({ success: true });
}
