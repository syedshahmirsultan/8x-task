"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-ink-2 transition-colors hover:bg-paper-2 hover:text-accent-strong"
    >
      <LogOut className="h-[1.1rem] w-[1.1rem]" />
      Log out
    </button>
  );
}
