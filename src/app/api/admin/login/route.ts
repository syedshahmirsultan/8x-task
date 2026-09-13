import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession, verifyAdminPassword } from "@/lib/admin";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const valid = verifyAdminPassword(parsed.data.email, parsed.data.password);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ success: true });
}
