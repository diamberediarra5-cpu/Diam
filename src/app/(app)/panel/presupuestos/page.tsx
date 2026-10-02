import type { Metadata } from "next";
import Link from "next/link";
import { STATUS_LABEL, StatusBadge } from "@/components/status-badge";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { requireUser } from "@/lib/session";
import { listQuotes, type QuoteStatusFilter } from "@/services/quotes";

export const metadata: Metadata = { title: "Presupuestos" };

const FILTERS: Array<{ value: QuoteStatusFilter; label: string }> = [
  { value: "ALL", label: "Todos" },
  ...(Object.keys(STATUS_LABEL) as Array<keyof typeof STATUS_LABEL>).map((k) => ({ value: k, label: STATUS_LABEL[k] })),
];

export default async function QuotesPage({ searchParams }: PageProps<"/panel/presupuestos">) {
  const user = await requireUser();
  const sp = await searchParams;
  const status = FILTERS.some((f) => f.value === sp.estado) ? (sp.estado as QuoteStatusFilter) : "ALL";
  const search = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const quotes = await listQuotes(user.id, { status, search });
  const filtering = status !== "ALL" || !!search;

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description="Todos tus presupuestos y en qué estado están."
        actions={<ButtonLink href="/panel/presupuestos/nuevo">+ Nuevo presupuesto</ButtonLink>}
      />
      <form className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center" role="search">
        <Input name="q" defaultValue={search} placeholder="Buscar por cliente, título o número" aria-label="Buscar presupuestos" className="sm:max-w-xs" />
        {status !== "ALL" && <input type="hidden" name="estado" value={status} />}
        <div className="flex flex-wrap gap-2" aria-label="Filtrar por estado">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={{ pathname: "/panel/presupuestos", query: { ...(f.value !== "ALL" ? { estado: f.value } : {}), ...(search ? { q: search } : {}) } }}
              className={cn(buttonClass(status === f.value ? "primary" : "secondary", "sm"))}
              aria-current={status === f.value ? "true" : undefined}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </form>

      {quotes.length === 0 ? (
        filtering ? (
          <EmptyState title="No hay resultados" description="Prueba con otra búsqueda o quita el filtro." />
        ) : (
          <EmptyState
            title="Aún no tienes presupuestos"
            description="Crea el primero en menos de 2 minutos."
            action={<ButtonLink href="/panel/presupuestos/nuevo">Hacer mi primer presupuesto</ButtonLink>}
          />
        )
      ) : (
        <Card className="divide-y divide-line">
          {quotes.map((q) => (
            <Link key={q.id} href={`/panel/presupuestos/${q.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface">
              <div className="min-w-0">
                <p className="truncate font-medium">{q.title}</p>
                <p className="truncate text-xs text-muted">
                  {q.number} · {q.clientName} · {formatDate(q.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-semibold tabular-nums">{formatCents(q.totalCents)}</span>
                <StatusBadge status={q.status} viewed={!!q.viewedAt} />
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
