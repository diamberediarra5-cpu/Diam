"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteClientAction, saveClientAction } from "@/actions/clients";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { Alert, Field, Input } from "@/components/ui/form";
import { clientSchema } from "@/validation/client";
import { fieldErrors } from "@/validation/common";

type ClientRow = {
  id: string;
  name: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  quotes: number;
};

function ClientForm({ client, onDone }: { client: ClientRow | null; onDone: () => void }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = clientSchema.safeParse(raw);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setLoading(true);
    const res = await saveClientAction(client?.id ?? null, raw as never);
    setLoading(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      return setFormError(res.error);
    }
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <Alert>{formError}</Alert>}
      <Field label="Nombre" htmlFor="c-name" error={errors.name}>
        <Input id="c-name" name="name" defaultValue={client?.name} aria-invalid={!!errors.name} autoFocus />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teléfono" htmlFor="c-phone" error={errors.phone}>
          <Input id="c-phone" name="phone" type="tel" defaultValue={client?.phone ?? ""} />
        </Field>
        <Field label="Email" htmlFor="c-email" error={errors.email}>
          <Input id="c-email" name="email" type="email" defaultValue={client?.email ?? ""} aria-invalid={!!errors.email} />
        </Field>
        <Field label="NIF / CIF" htmlFor="c-taxId" error={errors.taxId}>
          <Input id="c-taxId" name="taxId" defaultValue={client?.taxId ?? ""} />
        </Field>
        <Field label="Dirección" htmlFor="c-address" error={errors.address}>
          <Input id="c-address" name="address" defaultValue={client?.address ?? ""} />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {client ? "Guardar cambios" : "Crear cliente"}
        </Button>
      </div>
    </form>
  );
}

export function ClientManager({ clients, search }: { clients: ClientRow[]; search: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ClientRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<ClientRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form role="search" className="sm:max-w-xs sm:flex-1">
          <Input name="q" defaultValue={search} placeholder="Buscar cliente" aria-label="Buscar cliente" />
        </form>
        <Button onClick={() => setEditing("new")}>+ Nuevo cliente</Button>
      </div>

      {editing && (
        <Card className="p-4 sm:p-6">
          <h2 className="mb-4 text-base font-semibold">{editing === "new" ? "Nuevo cliente" : `Editar ${editing.name}`}</h2>
          <ClientForm client={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
        </Card>
      )}

      {clients.length === 0 ? (
        search ? (
          <EmptyState title="No hay resultados" description="Prueba con otro nombre." />
        ) : (
          <EmptyState
            title="Aún no tienes clientes"
            description="Se guardan solos al hacer un presupuesto, o puedes crearlos aquí."
            action={<Button onClick={() => setEditing("new")}>Crear cliente</Button>}
          />
        )
      ) : (
        <Card className="divide-y divide-line">
          {clients.map((c) => (
            <div key={c.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted">
                  {[c.phone, c.email, `${c.quotes} ${c.quotes === 1 ? "presupuesto" : "presupuestos"}`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1">
                <Link href={`/panel/presupuestos/nuevo?cliente=${c.id}`} className={buttonClass("secondary", "sm")}>
                  Presupuesto
                </Link>
                <Button variant="ghost" size="sm" onClick={() => setEditing(c)}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setDeleting(c)}>
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {deleting && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="del-client" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 id="del-client" className="text-lg font-semibold">
              ¿Eliminar a {deleting.name}?
            </h2>
            <p className="mt-2 text-sm text-muted">Sus presupuestos no se borran: conservan los datos del cliente.</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleting(null)} autoFocus>
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  const res = await deleteClientAction(deleting.id);
                  setBusy(false);
                  setDeleting(null);
                  if (!res.ok) return setError(res.error);
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
