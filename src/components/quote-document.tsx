import { formatDate } from "@/lib/dates";
import { formatCents, formatQuantity } from "@/lib/money";
import { site } from "@/lib/site";
import type { QuoteDto } from "@/services/quotes";

type Profile = {
  businessName: string;
  taxId: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
} | null;

/** El documento del presupuesto: mismo componente para el panel, el cliente final y la impresión/PDF. */
export function QuoteDocument({ quote, profile, showBranding }: { quote: QuoteDto; profile: Profile; showBranding: boolean }) {
  const location = [profile?.postalCode, profile?.city].filter(Boolean).join(" ");
  return (
    <article className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-10 print:border-0 print:p-0 print:shadow-none">
      <header className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:justify-between">
        <div className="text-sm">
          <p className="text-lg font-bold text-ink">{profile?.businessName}</p>
          {profile?.taxId && <p className="text-muted">NIF: {profile.taxId}</p>}
          {profile?.address && <p className="text-muted">{profile.address}</p>}
          {location && <p className="text-muted">{location}</p>}
          {profile?.phone && <p className="text-muted">Tel.: {profile.phone}</p>}
          {profile?.email && <p className="text-muted">{profile.email}</p>}
        </div>
        <div className="text-sm sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Presupuesto</p>
          <p className="text-xl font-bold">Nº {quote.number}</p>
          <p className="text-muted">Fecha: {formatDate(quote.issueDate)}</p>
          {quote.validUntil && <p className="text-muted">Válido hasta: {formatDate(quote.validUntil)}</p>}
        </div>
      </header>

      <section className="grid gap-6 border-b border-line py-6 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Cliente</p>
          <p className="mt-1 font-semibold">{quote.clientName}</p>
          {quote.clientTaxId && <p className="text-muted">NIF: {quote.clientTaxId}</p>}
          {quote.clientAddress && <p className="text-muted">{quote.clientAddress}</p>}
          {quote.clientPhone && <p className="text-muted">Tel.: {quote.clientPhone}</p>}
          {quote.clientEmail && <p className="text-muted">{quote.clientEmail}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Concepto</p>
          <p className="mt-1 font-semibold">{quote.title}</p>
        </div>
      </section>

      <section className="py-6">
        <table className="w-full text-sm">
          <thead className="hidden sm:table-header-group print:table-header-group">
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-2 font-semibold">Descripción</th>
              <th className="pb-2 text-right font-semibold">Cant.</th>
              <th className="pb-2 text-right font-semibold">Precio</th>
              <th className="pb-2 text-right font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr key={item.id} className="flex flex-col border-b border-line py-3 sm:table-row print:table-row">
                <td className="whitespace-pre-line sm:py-3 sm:pr-4 print:py-2">{item.description}</td>
                <td className="text-muted sm:py-3 sm:text-right sm:text-ink print:text-right">
                  <span className="sm:hidden print:hidden">
                    {formatQuantity(item.quantity)} {item.unit} × {formatCents(item.unitPriceCents)}
                  </span>
                  <span className="hidden whitespace-nowrap sm:inline print:inline">
                    {formatQuantity(item.quantity)} {item.unit}
                  </span>
                </td>
                <td className="hidden whitespace-nowrap py-3 text-right tabular-nums sm:table-cell print:table-cell">{formatCents(item.unitPriceCents)}</td>
                <td className="whitespace-nowrap text-right font-semibold tabular-nums sm:py-3">{formatCents(item.totalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-6 max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Base imponible</dt>
            <dd className="tabular-nums">{formatCents(quote.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">IVA ({quote.vatRate} %)</dt>
            <dd className="tabular-nums">{formatCents(quote.vatCents)}</dd>
          </div>
          {quote.irpfRate > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Retención IRPF ({quote.irpfRate} %)</dt>
              <dd className="tabular-nums">−{formatCents(quote.irpfCents)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCents(quote.totalCents)}</dd>
          </div>
        </dl>
      </section>

      {quote.notes && (
        <section className="border-t border-line pt-6 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Condiciones</p>
          <p className="mt-1 whitespace-pre-line text-slate-700">{quote.notes}</p>
        </section>
      )}

      {showBranding && (
        <footer className="mt-8 text-center text-xs text-muted">
          Presupuesto hecho con{" "}
          <a href={site.url} className="font-medium text-brand-700">
            {site.name}
          </a>
        </footer>
      )}
    </article>
  );
}
