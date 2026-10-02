import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { QuoteEditor } from "@/components/app/quote-editor";
import { PageHeader } from "@/components/ui/card";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/session";
import { getEditorContext, quoteToInitial } from "@/services/editor-data";
import { getQuote } from "@/services/quotes";

export const metadata: Metadata = { title: "Editar presupuesto" };

export default async function EditQuotePage({ params }: PageProps<"/panel/presupuestos/[id]/editar">) {
  const user = await requireUser();
  const { id } = await params;
  const quote = await getQuote(user.id, id).catch((e) => {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  if (quote.status === "ACCEPTED") redirect(`/panel/presupuestos/${id}`);
  const ctx = await getEditorContext(user.id);

  return (
    <div>
      <PageHeader title={`Editar presupuesto ${quote.number}`} />
      <QuoteEditor quoteId={quote.id} initial={quoteToInitial(quote)} clients={ctx.clients} ai={ctx.ai} />
    </div>
  );
}
