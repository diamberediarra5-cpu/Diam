import type { Metadata } from "next";
import { QuoteEditor } from "@/components/app/quote-editor";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { getEditorContext, newQuoteInitial } from "@/services/editor-data";

export const metadata: Metadata = { title: "Nuevo presupuesto" };

export default async function NewQuotePage({ searchParams }: PageProps<"/panel/presupuestos/nuevo">) {
  const user = await requireUser();
  const sp = await searchParams;
  const ctx = await getEditorContext(user.id);

  if (ctx.plan.quotesPerMonth !== null && ctx.usage.quotes >= ctx.plan.quotesPerMonth) {
    return (
      <div>
        <PageHeader title="Nuevo presupuesto" />
        <EmptyState
          title={`Has usado tus ${ctx.plan.quotesPerMonth} presupuestos gratis de este mes`}
          description="Pasa a Pro por 9,90 €/mes para crear presupuestos ilimitados, o espera al día 1 del mes que viene."
          action={<ButtonLink href="/panel/suscripcion">Ver plan Pro</ButtonLink>}
        />
      </div>
    );
  }

  const clientId = typeof sp.cliente === "string" && ctx.clients.some((c) => c.id === sp.cliente) ? sp.cliente : undefined;
  const initial = await newQuoteInitial(user.id, clientId);
  if (clientId) {
    const c = ctx.clients.find((x) => x.id === clientId)!;
    initial.client = { name: c.name, taxId: c.taxId ?? "", email: c.email ?? "", phone: c.phone ?? "", address: c.address ?? "" };
  }

  return (
    <div>
      <PageHeader title="Nuevo presupuesto" description="Cliente, trabajo y precios. Lo guardas y se lo envías por WhatsApp." />
      <QuoteEditor quoteId={null} initial={initial} clients={ctx.clients} ai={ctx.ai} />
    </div>
  );
}
