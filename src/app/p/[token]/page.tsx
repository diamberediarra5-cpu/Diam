import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { PublicResponse } from "@/components/public-response";
import { QuoteDocument } from "@/components/quote-document";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/form";
import { formatDate, isExpired } from "@/lib/dates";
import { getPublicQuote } from "@/services/quotes";
import { ViewTracker } from "@/components/view-tracker";

export const metadata: Metadata = {
  title: "Presupuesto",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PublicQuotePage({ params }: PageProps<"/p/[token]">) {
  const { token } = await params;
  const data = await getPublicQuote(token);
  if (!data) notFound();
  const { quote, profile, showBranding } = data;

  const expired = isExpired(quote.validUntil);
  const decided = quote.status === "ACCEPTED" || quote.status === "REJECTED";

  return (
    <main className="flex-1 bg-surface px-4 py-6 sm:py-10 print:bg-white print:p-0">
      {/* "Visto" se marca desde el navegador: los bots de vista previa (WhatsApp) no ejecutan JS. */}
      {!quote.viewedAt && <ViewTracker token={token} />}
      <div className="mx-auto max-w-3xl space-y-4">
        <Card className="no-print p-4 sm:p-6">
          {quote.status === "ACCEPTED" && (
            <Alert tone="success">Presupuesto aceptado el {formatDate(quote.respondedAt)}. ¡Gracias! {profile?.businessName} se pondrá en contacto contigo.</Alert>
          )}
          {quote.status === "REJECTED" && <Alert tone="info">Has rechazado este presupuesto el {formatDate(quote.respondedAt)}.</Alert>}
          {!decided && expired && <Alert tone="warning">Este presupuesto caducó el {formatDate(quote.validUntil)}. Pide uno actualizado.</Alert>}
          {!decided && !expired && <PublicResponse token={token} businessName={profile?.businessName ?? "el profesional"} />}
          <div className="mt-3 flex justify-end">
            <PrintButton />
          </div>
        </Card>
        <QuoteDocument quote={quote} profile={profile} showBranding={showBranding} />
      </div>
    </main>
  );
}
