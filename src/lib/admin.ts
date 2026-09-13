import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";

const SESSION_COOKIE = "kartify_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

/** Comma-separated allowlist — simplest way to gate admin access without a full roles system. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Clerk-verified identity + email allowlist — the first, always-required gate. */
export async function getAdminUser() {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  if (!email || !adminEmails().includes(email)) return null;
  return user;
}

function signSessionToken(userId: string): string {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  return createHmac("sha256", secret).update(userId).digest("hex");
}

/**
 * Constant-time comparison — a plain `===` would leak timing information
 * about how many leading characters matched, letting an attacker guess a
 * password/token byte by byte.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyAdminPassword(email: string, password: string, actualEmail: string): boolean {
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedPassword) return false; // never succeed if the operator hasn't set one
  const emailMatches = safeEqual(email.trim().toLowerCase(), actualEmail.trim().toLowerCase());
  const passwordMatches = safeEqual(password, expectedPassword);
  return emailMatches && passwordMatches;
}

/** Second gate, on top of Clerk auth — a shared password re-entered explicitly to open the dashboard. */
export async function hasAdminSession(userId: string): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return safeEqual(token, signSessionToken(userId));
}

export async function createAdminSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
