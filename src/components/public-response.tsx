"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { respondToQuoteAction } from "@/actions/quotes";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";

export function PublicResponse({ token, businessName }: { token: string; businessName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);
  const [error, setError] = useState("");

  async function respond(decision: "ACCEPTED" | "REJECTED") {
    setError("");
    setBusy(decision);
    const res = await respondToQuoteAction(token, decision);
    setBusy(null);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <Alert>{error}</Alert>}
      <p className="text-sm text-muted">¿Te encaja? Responde con un clic y {businessName} recibirá tu respuesta.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button size="lg" className="w-full" loading={busy === "ACCEPTED"} disabled={!!busy} onClick={() => respond("ACCEPTED")}>
          Aceptar presupuesto
        </Button>
        {confirmReject ? (
          <Button variant="danger" size="lg" className="w-full" loading={busy === "REJECTED"} disabled={!!busy} onClick={() => respond("REJECTED")}>
            Confirmar rechazo
          </Button>
        ) : (
          <Button variant="secondary" size="lg" className="w-full" disabled={!!busy} onClick={() => setConfirmReject(true)}>
            Rechazar
          </Button>
        )}
      </div>
    </div>
  );
}
