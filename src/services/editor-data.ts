import "server-only";
import { addDays, toDateInput } from "@/lib/dates";
import { centsToEuros } from "@/lib/money";
import type { EditorInitial } from "@/components/app/quote-editor";
import { isAiEnabled } from "./ai";
import { listClients } from "./clients";
import { getProfile } from "./profile";
import type { QuoteDto } from "./quotes";
import { getPlan, getUsage } from "./subscription";

export async function getEditorContext(userId: string) {
  const [clients, plan, usage] = await Promise.all([listClients(userId), getPlan(userId), getUsage(userId)]);
  return {
    clients: clients.map(({ id, name, taxId, email, phone, address }) => ({ id, name, taxId, email, phone, address })),
    ai: { enabled: isAiEnabled(), remaining: Math.max(0, plan.aiPerMonth - usage.ai), isFree: plan.key === "FREE" },
    plan,
    usage,
  };
}

export async function newQuoteInitial(userId: string, clientId?: string): Promise<EditorInitial> {
  const profile = await getProfile(userId);
  return {
    clientId: clientId ?? null,
    client: { name: "", taxId: "", email: "", phone: "", address: "" },
    title: "",
    validUntil: toDateInput(addDays(new Date(), 30)),
    vatRate: profile?.defaultVatRate ?? 21,
    irpfRate: 0,
    notes: profile?.defaultNotes ?? "",
    items: [],
  };
}

export function quoteToInitial(q: QuoteDto): EditorInitial {
  return {
    clientId: q.clientId,
    client: {
      name: q.clientName,
      taxId: q.clientTaxId ?? "",
      email: q.clientEmail ?? "",
      phone: q.clientPhone ?? "",
      address: q.clientAddress ?? "",
    },
    title: q.title,
    validUntil: toDateInput(q.validUntil),
    vatRate: q.vatRate,
    irpfRate: q.irpfRate,
    notes: q.notes ?? "",
    items: q.items.map((i) => ({ description: i.description, quantity: i.quantity, unit: i.unit, unitPrice: centsToEuros(i.unitPriceCents) })),
  };
}
