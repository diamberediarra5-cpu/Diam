import type { Metadata } from "next";
import { PortalButton, UpgradeButton } from "@/components/app/billing-buttons";
import { Card, PageHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/form";
import { formatDate } from "@/lib/dates";
import { PLANS } from "@/lib/plans";
import { requireUser } from "@/lib/session";
import { isBillingEnabled } from "@/services/billing/stripe";
import { getPlanAndUsage } from "@/services/subscription";

export const metadata: Metadata = { title: "Plan y facturación" };

function Meter({ label, used, max }: { label: string; used: number; max: number | null }) {
  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted">
          {used} / {max ?? "∞"}
        </span>
      </div>
      {max !== null && (
        <div className="mt-1.5 h-2 rounded-full bg-slate-100" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
          <div className={`h-2 rounded-full ${pct >= 100 ? "bg-red-500" : "bg-brand-600"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default async function SubscriptionPage({ searchParams }: PageProps<"/panel/suscripcion">) {
  const user = await requireUser();
  const sp = await searchParams;
  const { plan, usage, subscription } = await getPlanAndUsage(user.id);
  const billing = isBillingEnabled();
  const isPro = plan.key === "PRO";

  return (
    <div className="space-y-6">
      <PageHeader title="Plan y facturación" />
      {sp.estado === "ok" && (
        <Alert tone="success">
          ¡Gracias! Estamos confirmando el pago con Stripe. Si tu plan aún aparece como Gratis, recarga la página en unos segundos.
        </Alert>
      )}
      {sp.estado === "cancelado" && <Alert tone="info">No se ha hecho ningún cargo. Puedes pasar a Pro cuando quieras.</Alert>}
      {subscription?.status === "past_due" && (
        <Alert tone="warning">No hemos podido cobrar tu última cuota. Actualiza tu tarjeta para no perder el plan Pro.</Alert>
      )}

      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">
            Tu plan: <span className="text-brand-700">{plan.name}</span>
          </h2>
          {isPro && subscription?.currentPeriodEnd && (
            <p className="text-sm text-muted">
              {subscription.cancelAtPeriodEnd
                ? `Se cancelará el ${formatDate(subscription.currentPeriodEnd)}`
                : `Se renueva el ${formatDate(subscription.currentPeriodEnd)}`}
            </p>
          )}
        </div>
        <div className="mt-4 space-y-4">
          <Meter label="Presupuestos creados este mes" used={usage.quotes} max={plan.quotesPerMonth} />
          <Meter label="Generaciones con IA este mes" used={usage.ai} max={plan.aiPerMonth} />
        </div>
        {subscription?.stripeCustomerId && billing && (
          <div className="mt-6">
            <PortalButton />
          </div>
        )}
      </Card>

      {!isPro && (
        <Card className="border-brand-200 p-4 sm:p-6">
          <p className="text-sm font-semibold text-brand-700">Plan Pro</p>
          <p className="mt-1 text-3xl font-bold">
            9,90 €<span className="text-base font-normal text-muted">/mes, IVA incluido</span>
          </p>
          <ul className="my-5 space-y-2 text-sm">
            {PLANS.PRO.features.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-brand-700" aria-hidden="true">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
          {billing ? (
            <UpgradeButton />
          ) : (
            <Alert tone="info">Los pagos se activarán muy pronto. Si quieres Pro ya, escríbenos desde la página de contacto.</Alert>
          )}
          <p className="mt-3 text-xs text-muted">Pago seguro con Stripe. Cancelas cuando quieras, sin permanencia.</p>
        </Card>
      )}
    </div>
  );
}
