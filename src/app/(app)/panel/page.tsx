import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { formatDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { requireUser } from "@/lib/session";
import { dashboardStats } from "@/services/quotes";
import { getPlanAndUsage } from "@/services/subscription";

export const metadata: Metadata = { title: "Inicio" };

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, { plan, usage }] = await Promise.all([dashboardStats(user.id), getPlanAndUsage(user.id)]);
  const firstName = user.name.split(" ")[0];
  const limitReached = plan.quotesPerMonth !== null && usage.quotes >= plan.quotesPerMonth;

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hola, {firstName}</h1>
          <p className="mt-1 text-sm text-muted">
            {stats.pendingCount > 0
              ? `Tienes ${stats.pendingCount} ${stats.pendingCount === 1 ? "presupuesto pendiente" : "presupuestos pendientes"} de respuesta.`
              : "Haz un presupuesto y envíaselo a tu cliente por WhatsApp."}
          </p>
        </div>
        <ButtonLink href="/panel/presupuestos/nuevo" size="lg" className="w-full sm:w-auto">
          + Nuevo presupuesto
        </ButtonLink>
      </section>

      {plan.key === "FREE" && (
        <Card className="flex flex-col gap-3 border-brand-200 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-900">
            Plan Gratis: has creado <strong>{usage.quotes} de {plan.quotesPerMonth}</strong> presupuestos este mes y usado{" "}
            <strong>
              {usage.ai} de {plan.aiPerMonth}
            </strong>{" "}
            generaciones con IA.
            {limitReached && " Has llegado al límite."}
          </p>
          <ButtonLink href="/panel/suscripcion" variant={limitReached ? "primary" : "secondary"} size="sm">
            Pasar a Pro
          </ButtonLink>
        </Card>
      )}

      <section aria-label="Resumen del mes" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Este mes" value={String(stats.monthCount)} sub="presupuestos creados" />
        <Stat label="Pendientes" value={formatCents(stats.pendingCents)} sub={`${stats.pendingCount} enviados sin respuesta`} />
        <Stat label="Aceptado este mes" value={formatCents(stats.acceptedCents)} sub={`${stats.acceptedCount} presupuestos`} />
        <Stat label="Tasa de aceptación" value={stats.acceptanceRate === null ? "—" : `${stats.acceptanceRate} %`} sub="de los respondidos este mes" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimos presupuestos</h2>
          {stats.recent.length > 0 && (
            <Link href="/panel/presupuestos" className="text-sm font-medium text-brand-700 hover:underline">
              Ver todos
            </Link>
          )}
        </div>
        {stats.recent.length === 0 ? (
          <EmptyState
            title="Aún no tienes presupuestos"
            description="Describe el trabajo en una frase y la IA te propone las partidas. Tardas menos de 2 minutos."
            action={<ButtonLink href="/panel/presupuestos/nuevo">Hacer mi primer presupuesto</ButtonLink>}
          />
        ) : (
          <Card className="divide-y divide-line">
            {stats.recent.map((q) => (
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
      </section>
    </div>
  );
}
