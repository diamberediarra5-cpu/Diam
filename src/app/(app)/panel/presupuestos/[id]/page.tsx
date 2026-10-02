import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteActions } from "@/components/app/quote-actions";
import { QuoteDocument } from "@/components/quote-document";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/form";
import { formatDate } from "@/lib/dates";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/session";
import { getProfile } from "@/services/profile";
import { getQuote } from "@/services/quotes";
import { getPlan } from "@/services/subscription";

export const metadata: Metadata = { title: "Presupuesto" };

export default async function QuoteDetailPage({ params, searchParams }: PageProps<"/panel/presupuestos/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const quote = await getQuote(user.id, id).catch((e) => {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  const [profile, plan] = await Promise.all([getProfile(user.id), getPlan(user.id)]);
  const publicUrl = `${env.appUrl}/p/${quote.publicToken}`;

  return (
    <div className="space-y-6">
      <div className="no-print">
        <Link href="/panel/presupuestos" className="text-sm font-medium text-brand-700 hover:underline">
          ← Presupuestos
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{quote.title}</h1>
          <StatusBadge status={quote.status} viewed={!!quote.viewedAt} />
        </div>
        <p className="mt-1 text-sm text-muted">
          Nº {quote.number} · {quote.clientName}
          {quote.sentAt && ` · Enviado el ${formatDate(quote.sentAt)}`}
          {quote.viewedAt && ` · Visto el ${formatDate(quote.viewedAt)}`}
          {quote.respondedAt && ` · Respondido el ${formatDate(quote.respondedAt)}`}
        </p>
      </div>

      {sp.nuevo && (
        <div className="no-print">
          <Alert tone="success">¡Presupuesto guardado! Envíaselo ahora a tu cliente por WhatsApp o copia el enlace.</Alert>
        </div>
      )}

      <Card className="no-print p-4 sm:p-6">
        <QuoteActions
          id={quote.id}
          status={quote.status}
          publicUrl={publicUrl}
          clientName={quote.clientName}
          clientPhone={quote.clientPhone}
          businessName={profile?.businessName ?? ""}
          number={quote.number}
        />
      </Card>

      <QuoteDocument quote={quote} profile={profile} showBranding={plan.branding} />
    </div>
  );
}
