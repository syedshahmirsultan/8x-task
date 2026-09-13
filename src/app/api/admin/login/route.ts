import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession, getAdminUser, verifyAdminPassword } from "@/lib/admin";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  // Clerk sign-in + email allowlist is still the first gate — this endpoint
  // only ever grants the dashboard cookie to someone who already passes it.
  const admin = await getAdminUser();
  const actualEmail = admin?.primaryEmailAddress?.emailAddress;
  if (!admin || !actualEmail) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const valid = verifyAdminPassword(parsed.data.email, parsed.data.password, actualEmail);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  await createAdminSession(admin.id);
  return NextResponse.json({ success: true });
}
