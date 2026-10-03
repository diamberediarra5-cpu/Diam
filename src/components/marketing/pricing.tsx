import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { PLANS } from "@/lib/plans";

export function Pricing() {
  const plans = [PLANS.FREE, PLANS.PRO];
  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      {plans.map((p) => {
        const pro = p.key === "PRO";
        return (
          <div key={p.key} className={cn("relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm sm:p-8", pro ? "border-brand-600 ring-1 ring-brand-600" : "border-line")}>
            {pro && (
              <span className="absolute -top-3 left-6 rounded-full bg-brand-700 px-3 py-0.5 text-xs font-semibold text-white">Para quien hace presupuestos cada semana</span>
            )}
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <p className="mt-2">
              <span className="text-4xl font-bold">{p.priceLabel}</span>
              <span className="text-muted">{pro ? " /mes, IVA incl." : " para siempre"}</span>
            </p>
            <ul className="my-6 flex-1 space-y-2.5 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="font-bold text-brand-700" aria-hidden="true">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <ButtonLink href="/registro" variant={pro ? "primary" : "secondary"} size="lg" className="w-full">
              {pro ? "Empezar y pasar a Pro" : "Crear cuenta gratis"}
            </ButtonLink>
            <p className="mt-3 text-center text-xs text-muted">{pro ? "Sin permanencia. Cancelas con un clic." : "Sin tarjeta de crédito."}</p>
          </div>
        );
      })}
    </div>
  );
}
