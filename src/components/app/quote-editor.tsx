"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateItemsAction, saveQuoteAction, trackEventAction } from "@/actions/quotes";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, Field, Input, Select, Textarea } from "@/components/ui/form";
import { eurosToCents, formatCents } from "@/lib/money";
import { computeTotals } from "@/lib/quote-math";
import { fieldErrors } from "@/validation/common";
import { VAT_RATES } from "@/validation/profile";
import { IRPF_RATES, quoteSchema, UNITS, type QuoteInput } from "@/validation/quote";

export type EditorClient = {
  id: string;
  name: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

type ItemRow = { key: number; description: string; quantity: string; unit: string; unitPrice: string };

export type EditorInitial = {
  clientId: string | null;
  client: { name: string; taxId: string; email: string; phone: string; address: string };
  title: string;
  validUntil: string;
  vatRate: number;
  irpfRate: number;
  notes: string;
  items: Array<{ description: string; quantity: number; unit: string; unitPrice: number }>;
};

/** "1.234,5" o "1234.5" → número. */
function parseDecimal(value: string): number {
  const v = value.trim();
  if (!v) return NaN;
  const normalized = v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v;
  return Number(normalized);
}

function toInputNumber(n: number) {
  return Number.isFinite(n) ? String(n).replace(".", ",") : "";
}

let keySeq = 0;
const newRow = (r?: Partial<Omit<ItemRow, "key">>): ItemRow => ({
  key: ++keySeq,
  description: r?.description ?? "",
  quantity: r?.quantity ?? "1",
  unit: r?.unit ?? "ud",
  unitPrice: r?.unitPrice ?? "",
});

export function QuoteEditor({
  quoteId,
  initial,
  clients,
  ai,
}: {
  quoteId: string | null;
  initial: EditorInitial;
  clients: EditorClient[];
  ai: { enabled: boolean; remaining: number; isFree: boolean };
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState<string>(initial.clientId ?? "");
  const [client, setClient] = useState(initial.client);
  const [showClientDetails, setShowClientDetails] = useState(Boolean(initial.client.taxId || initial.client.address || initial.client.email));
  const [title, setTitle] = useState(initial.title);
  const [items, setItems] = useState<ItemRow[]>(() =>
    initial.items.length
      ? initial.items.map((i) => newRow({ description: i.description, quantity: toInputNumber(i.quantity), unit: i.unit, unitPrice: toInputNumber(i.unitPrice) }))
      : [newRow()],
  );
  const [vatRate, setVatRate] = useState(initial.vatRate);
  const [irpfRate, setIrpfRate] = useState(initial.irpfRate);
  const [validUntil, setValidUntil] = useState(initial.validUntil);
  const [notes, setNotes] = useState(initial.notes);

  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiRemaining, setAiRemaining] = useState(ai.remaining);
  const [aiDone, setAiDone] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!quoteId) void trackEventAction("main_action_started");
  }, [quoteId]);

  // Al corregir cualquier campo, los errores anteriores dejan de ser válidos.
  const editVersion = useRef(0);
  useEffect(() => {
    if (editVersion.current++ === 0) return;
    setErrors({});
    setFormError("");
  }, [client, clientId, title, items, validUntil, notes]);

  const totals = useMemo(() => {
    const lines = items.map((i) => {
      const q = parseDecimal(i.quantity);
      const p = parseDecimal(i.unitPrice || "0");
      return { quantity: Number.isFinite(q) && q > 0 ? q : 0, unitPriceCents: Number.isFinite(p) && p >= 0 ? eurosToCents(p) : 0 };
    });
    return computeTotals(lines, vatRate, irpfRate);
  }, [items, vatRate, irpfRate]);

  function pickClient(id: string) {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    setClient(
      c
        ? { name: c.name, taxId: c.taxId ?? "", email: c.email ?? "", phone: c.phone ?? "", address: c.address ?? "" }
        : { name: "", taxId: "", email: "", phone: "", address: "" },
    );
  }

  function updateItem(key: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function generate() {
    setAiError("");
    if (aiText.trim().length < 15) {
      setAiError("Describe el trabajo con un poco más de detalle (mín. 15 caracteres).");
      return;
    }
    setAiLoading(true);
    const res = await generateItemsAction({ description: aiText });
    setAiLoading(false);
    if (!res.ok) {
      setAiError(res.fieldErrors?.description ?? res.error);
      return;
    }
    const hasContent = items.some((i) => i.description.trim());
    const generated = res.data.items.map((i) =>
      newRow({ description: i.description, quantity: toInputNumber(i.quantity), unit: i.unit, unitPrice: i.unitPrice ? toInputNumber(i.unitPrice) : "" }),
    );
    setItems(hasContent ? [...items.filter((i) => i.description.trim()), ...generated] : generated);
    if (!title.trim()) setTitle(res.data.title);
    setAiRemaining((n) => Math.max(0, n - 1));
    setAiDone(true);
  }

  function buildInput(): QuoteInput {
    return {
      clientId: clientId || null,
      client,
      saveClient: !clientId,
      title,
      validUntil: validUntil || null,
      vatRate,
      irpfRate,
      notes,
      items: items
        .filter((i) => i.description.trim() || i.unitPrice.trim())
        .map((i) => ({
          description: i.description,
          quantity: parseDecimal(i.quantity) as unknown as number,
          unit: i.unit,
          unitPrice: (i.unitPrice.trim() ? parseDecimal(i.unitPrice) : 0) as unknown as number,
        })),
    };
  }

  function showErrors(errs: Record<string, string>, message: string) {
    setErrors(errs);
    setFormError(message);
    requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  async function save() {
    const input = buildInput();
    const parsed = quoteSchema.safeParse(input);
    if (!parsed.success) {
      showErrors(fieldErrors(parsed.error), "Revisa los campos marcados en rojo.");
      return;
    }
    setErrors({});
    setFormError("");
    setSaving(true);
    const res = await saveQuoteAction(quoteId, input);
    if (!res.ok) {
      setSaving(false);
      showErrors(res.fieldErrors ?? {}, res.error);
      return;
    }
    router.push(`/panel/presupuestos/${res.data.id}${quoteId ? "" : "?nuevo=1"}`);
    router.refresh();
  }

  // Los índices de error de Zod se refieren a las filas "con contenido".
  const filledIndex = new Map<number, number>();
  items.filter((i) => i.description.trim() || i.unitPrice.trim()).forEach((i, idx) => filledIndex.set(i.key, idx));
  const itemError = (key: number, field: string) => {
    const idx = filledIndex.get(key);
    return idx === undefined ? undefined : errors[`items.${idx}.${field}`];
  };

  return (
    <div className="space-y-6 pb-32">
      <div ref={errorRef}>{formError && <Alert>{formError}</Alert>}</div>

      {/* 1. Cliente */}
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">1. ¿Para quién es?</h2>
        <div className="space-y-4">
          {clients.length > 0 && (
            <Field label="Cliente" htmlFor="clientPick">
              <Select id="clientPick" value={clientId} onChange={(e) => pickClient(e.target.value)}>
                <option value="">+ Cliente nuevo</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del cliente" htmlFor="clientName" error={errors["client.name"]}>
              <Input
                id="clientName"
                value={client.name}
                onChange={(e) => setClient({ ...client, name: e.target.value })}
                aria-invalid={!!errors["client.name"]}
                autoComplete="off"
                placeholder="Ej.: María García"
              />
            </Field>
            <Field label="Teléfono" htmlFor="clientPhone" error={errors["client.phone"]}>
              <Input id="clientPhone" type="tel" value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} autoComplete="off" />
            </Field>
          </div>
          {showClientDetails ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor="clientEmail" error={errors["client.email"]}>
                <Input
                  id="clientEmail"
                  type="email"
                  value={client.email}
                  onChange={(e) => setClient({ ...client, email: e.target.value })}
                  aria-invalid={!!errors["client.email"]}
                  autoComplete="off"
                />
              </Field>
              <Field label="NIF / CIF" htmlFor="clientTaxId" error={errors["client.taxId"]}>
                <Input id="clientTaxId" value={client.taxId} onChange={(e) => setClient({ ...client, taxId: e.target.value })} autoComplete="off" />
              </Field>
              <Field label="Dirección de la obra o del cliente" htmlFor="clientAddress" className="sm:col-span-2" error={errors["client.address"]}>
                <Input id="clientAddress" value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} autoComplete="off" />
              </Field>
            </div>
          ) : (
            <button type="button" className="text-sm font-medium text-brand-700 hover:underline" onClick={() => setShowClientDetails(true)}>
              + Añadir email, NIF o dirección
            </button>
          )}
          {!clientId && <p className="text-xs text-muted">Guardaremos este cliente para la próxima vez.</p>}
        </div>
      </Card>

      {/* 2. IA */}
      <Card className="border-brand-200 p-4 sm:p-6">
        <h2 className="text-base font-semibold">2. Describe el trabajo</h2>
        <p className="mb-3 mt-1 text-sm text-muted">Escríbelo como se lo contarías a un compañero. La IA te propone las partidas y tú ajustas los precios.</p>
        {ai.enabled ? (
          <div className="space-y-3">
            <Textarea
              id="aiText"
              aria-label="Descripción del trabajo"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              rows={3}
              maxLength={1500}
              placeholder="Ej.: Cambiar bañera por plato de ducha de 120x80 con mampara, alicatar la zona de la ducha y cambiar el grifo."
            />
            {aiError && <Alert>{aiError}</Alert>}
            {aiDone && !aiError && <Alert tone="success">Partidas añadidas abajo. Revisa cantidades y precios antes de guardar.</Alert>}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="primary" onClick={generate} loading={aiLoading} disabled={aiRemaining <= 0}>
                {aiLoading ? "Generando partidas…" : "✨ Generar partidas con IA"}
              </Button>
              <p className="text-xs text-muted">
                Te quedan {aiRemaining} {aiRemaining === 1 ? "generación" : "generaciones"} este mes.
                {aiRemaining <= 0 && ai.isFree && (
                  <>
                    {" "}
                    <a href="/panel/suscripcion" className="font-medium text-brand-700 underline">
                      Pasa a Pro
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">El asistente de IA no está disponible ahora mismo. Añade las partidas a mano abajo.</p>
        )}
      </Card>

      {/* 3. Partidas */}
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">3. Partidas</h2>
        <Field label="Título del presupuesto" htmlFor="title" error={errors.title}>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} placeholder="Ej.: Reforma de baño" />
        </Field>
        {errors.items && <p className="mt-3 text-sm text-red-600" role="alert">{errors.items}</p>}
        <ol className="mt-4 space-y-4">
          {items.map((row, index) => {
            const lineTotal = totals.lines[index] ?? 0;
            return (
              <li key={row.key} className="rounded-lg border border-line p-3 sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">Partida {index + 1}</span>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                    onClick={() => setItems((rows) => rows.filter((r) => r.key !== row.key))}
                    disabled={items.length === 1}
                    aria-label={`Eliminar partida ${index + 1}`}
                  >
                    Eliminar
                  </button>
                </div>
                <Textarea
                  aria-label={`Descripción de la partida ${index + 1}`}
                  value={row.description}
                  onChange={(e) => updateItem(row.key, { description: e.target.value })}
                  rows={2}
                  className="min-h-0"
                  placeholder="Descripción"
                  aria-invalid={!!itemError(row.key, "description")}
                />
                {itemError(row.key, "description") && <p className="mt-1 text-sm text-red-600">{itemError(row.key, "description")}</p>}
                <div className="mt-2 grid grid-cols-[1fr_1fr_1.3fr] gap-2 sm:grid-cols-[100px_130px_150px_1fr]">
                  <div>
                    <label className="text-xs text-muted" htmlFor={`q-${row.key}`}>
                      Cantidad
                    </label>
                    <Input
                      id={`q-${row.key}`}
                      inputMode="decimal"
                      value={row.quantity}
                      onChange={(e) => updateItem(row.key, { quantity: e.target.value })}
                      aria-invalid={!!itemError(row.key, "quantity")}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted" htmlFor={`u-${row.key}`}>
                      Unidad
                    </label>
                    <Select id={`u-${row.key}`} value={row.unit} onChange={(e) => updateItem(row.key, { unit: e.target.value })}>
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted" htmlFor={`p-${row.key}`}>
                      Precio (€, sin IVA)
                    </label>
                    <Input
                      id={`p-${row.key}`}
                      inputMode="decimal"
                      value={row.unitPrice}
                      placeholder="0,00"
                      onChange={(e) => updateItem(row.key, { unitPrice: e.target.value })}
                      aria-invalid={!!itemError(row.key, "unitPrice")}
                    />
                  </div>
                  <div className="col-span-3 flex items-end justify-end sm:col-span-1">
                    <span className="text-sm font-semibold tabular-nums">{formatCents(lineTotal)}</span>
                  </div>
                </div>
                {(itemError(row.key, "quantity") || itemError(row.key, "unitPrice")) && (
                  <p className="mt-1 text-sm text-red-600">{itemError(row.key, "quantity") ?? itemError(row.key, "unitPrice")}</p>
                )}
              </li>
            );
          })}
        </ol>
        <Button type="button" variant="secondary" className="mt-4 w-full sm:w-auto" onClick={() => setItems((rows) => [...rows, newRow()])}>
          + Añadir partida
        </Button>
      </Card>

      {/* 4. Condiciones */}
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">4. Impuestos y condiciones</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="IVA" htmlFor="vatRate">
            <Select id="vatRate" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))}>
              {VAT_RATES.map((r) => (
                <option key={r} value={r}>
                  {r} %
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Retención IRPF" htmlFor="irpfRate" hint="Solo si facturas a empresas o autónomos">
            <Select id="irpfRate" value={irpfRate} onChange={(e) => setIrpfRate(Number(e.target.value))}>
              {IRPF_RATES.map((r) => (
                <option key={r} value={r}>
                  {r === 0 ? "Sin retención" : `${r} %`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Válido hasta" htmlFor="validUntil" error={errors.validUntil}>
            <Input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </Field>
        </div>
        <Field label="Notas y condiciones" htmlFor="notes" className="mt-4" error={errors.notes}>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Forma de pago, plazos de ejecución, garantía…" />
        </Field>
      </Card>

      {/* Barra fija de totales */}
      <div className="no-print fixed inset-x-0 bottom-[60px] z-20 border-t border-line bg-white/95 backdrop-blur lg:bottom-0 lg:left-60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 text-sm">
            <p className="hidden text-xs text-muted sm:block">
              Base {formatCents(totals.subtotalCents)} · IVA {formatCents(totals.vatCents)}
              {totals.irpfCents > 0 && ` · IRPF −${formatCents(totals.irpfCents)}`}
            </p>
            <p className="text-xs text-muted sm:hidden">IVA {totals.irpfCents > 0 ? "e IRPF " : ""}incluidos</p>
            <p className="whitespace-nowrap text-lg font-bold tabular-nums">Total {formatCents(totals.totalCents)}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <span className="hidden sm:block">
              <ButtonLink href={quoteId ? `/panel/presupuestos/${quoteId}` : "/panel/presupuestos"} variant="ghost">
                Cancelar
              </ButtonLink>
            </span>
            <Button type="button" onClick={save} loading={saving} size="lg">
              {quoteId ? "Guardar cambios" : "Guardar presupuesto"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
