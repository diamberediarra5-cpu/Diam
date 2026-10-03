"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteQuoteAction, duplicateQuoteAction, markSharedAction, setQuoteStatusAction } from "@/actions/quotes";
import { STATUS_LABEL } from "@/components/status-badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Alert, Select } from "@/components/ui/form";

type Props = {
  id: string;
  status: keyof typeof STATUS_LABEL;
  publicUrl: string;
  clientName: string;
  clientPhone: string | null;
  businessName: string;
  number: string;
};

/** Normaliza un teléfono español para wa.me (añade 34 si son 9 cifras). */
function waPhone(phone: string | null) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 9) return `34${digits}`;
  return digits.replace(/^00/, "");
}

export function QuoteActions(p: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const message = `Hola ${p.clientName.split(" ")[0]}, te envío el presupuesto ${p.number} de ${p.businessName}. Puedes verlo y aceptarlo aquí: ${p.publicUrl}`;
  const waUrl = `https://wa.me/${waPhone(p.clientPhone)}?text=${encodeURIComponent(message)}`;

  async function act(name: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    setBusy(name);
    const res = await fn();
    setBusy(null);
    if (!res.ok) setError(res.error ?? "Algo ha fallado.");
    else router.refresh();
    return res;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(p.publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      void markSharedAction(p.id).then(() => router.refresh());
    } catch {
      setError("No hemos podido copiar el enlace. Cópialo manualmente: " + p.publicUrl);
    }
  }

  return (
    <div className="no-print space-y-4">
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-2 sm:grid-cols-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("whatsapp", "lg", "w-full")}
          onClick={() => void markSharedAction(p.id).then(() => router.refresh())}
        >
          Enviar por WhatsApp
        </a>
        <Button variant="secondary" size="lg" className="w-full" onClick={copy}>
          {copied ? "¡Enlace copiado!" : "Copiar enlace"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/p/${p.publicUrl.split("/p/")[1]}`} target="_blank" className={buttonClass("ghost", "sm")}>
          Ver como cliente
        </Link>
        <button type="button" className={buttonClass("ghost", "sm")} onClick={() => window.print()}>
          Imprimir / PDF
        </button>
        {p.status !== "ACCEPTED" && (
          <Link href={`/panel/presupuestos/${p.id}/editar`} className={buttonClass("ghost", "sm")}>
            Editar
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          loading={busy === "dup"}
          onClick={async () => {
            setError("");
            setBusy("dup");
            const res = await duplicateQuoteAction(p.id);
            setBusy(null);
            if (!res.ok) return setError(res.error);
            router.push(`/panel/presupuestos/${res.data.id}/editar`);
          }}
        >
          Duplicar
        </Button>
        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
          Eliminar
        </Button>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor="status" className="text-muted">
          Estado:
        </label>
        <Select
          id="status"
          className="h-9 w-auto"
          value={p.status}
          disabled={busy === "status"}
          onChange={(e) => act("status", () => setQuoteStatusAction(p.id, e.target.value))}
        >
          {Object.entries(STATUS_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {confirmDelete && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="del-title" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 id="del-title" className="text-lg font-semibold">
              ¿Eliminar el presupuesto {p.number}?
            </h2>
            <p className="mt-2 text-sm text-muted">El enlace que enviaste dejará de funcionar. Esta acción no se puede deshacer.</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmDelete(false)} autoFocus>
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={busy === "del"}
                onClick={async () => {
                  setBusy("del");
                  const res = await deleteQuoteAction(p.id);
                  setBusy(null);
                  if (!res.ok) {
                    setConfirmDelete(false);
                    return setError(res.error);
                  }
                  router.push("/panel/presupuestos?eliminado=1");
                  router.refresh();
                }}
              >
                Sí, eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
