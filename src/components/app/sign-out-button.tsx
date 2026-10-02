"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      className={cn("text-sm font-medium text-muted hover:text-ink disabled:opacity-60", className)}
      onClick={async () => {
        setLoading(true);
        await authClient.signOut();
        router.push("/entrar");
        router.refresh();
      }}
    >
      {loading ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
