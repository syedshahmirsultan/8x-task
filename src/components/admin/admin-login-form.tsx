"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't sign in.");
        return;
      }
      // The dashboard itself checks the session cookie server-side —
      // refresh so that check runs again now that it's set.
      router.refresh();
    } catch {
      setError("Couldn't sign in — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-3xl bg-white p-7 shadow-[0_24px_60px_-30px_rgb(19_25_33/0.45)] ring-1 ring-ink/[0.05]">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-accent">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink">Admin access</h1>
        <p className="mt-1 text-sm text-ink-2">Confirm your admin email and password to continue.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 text-gray-400 transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-accent-strong/10 px-3 py-2 text-sm text-accent-strong">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full cursor-pointer rounded-full bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-secondary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Verifying…" : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
