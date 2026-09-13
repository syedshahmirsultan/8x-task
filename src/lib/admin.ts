import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "kartify_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

/** Comma-separated allowlist — simplest way to gate admin access without a full roles system. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
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

/**
 * The session token doesn't need to identify anyone — it only needs to prove
 * the holder already passed the email/password check once. Deriving it from
 * ADMIN_PASSWORD also means rotating that env var invalidates every existing
 * session automatically.
 */
function sessionToken(): string {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  return createHmac("sha256", secret).update("kartify-admin-session").digest("hex");
}

/**
 * The only gate: a shared email + password, unrelated to Clerk sign-in — so
 * the dashboard is reachable from any device or account that knows the
 * credentials, not just whoever is signed into a specific allowlisted
 * Clerk account on this browser.
 */
export function verifyAdminPassword(email: string, password: string): boolean {
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedPassword) return false; // never succeed if the operator hasn't set one
  const emailAllowed = adminEmails().includes(email.trim().toLowerCase());
  const passwordMatches = safeEqual(password, expectedPassword);
  return emailAllowed && passwordMatches;
}

export async function hasAdminSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return safeEqual(token, sessionToken());
}

export async function createAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
