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
      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left font-medium text-gray-500 hover:bg-background"
    >
      <LogOut className="h-4 w-4" />
      Log out
    </button>
  );
}
