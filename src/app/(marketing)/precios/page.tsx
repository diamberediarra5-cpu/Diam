import type { Metadata } from "next";
import { Faq } from "@/components/marketing/faq";
import { Pricing } from "@/components/marketing/pricing";

export const metadata: Metadata = {
  title: "Precios",
  description: "Presupuéstalo es gratis para empezar (5 presupuestos al mes). Pro por 9,90 €/mes con presupuestos ilimitados y 100 generaciones con IA. Sin permanencia.",
  alternates: { canonical: "/precios" },
};

export default function PricingPage() {
  return (
    <div className="bg-surface">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h1 className="text-center text-4xl font-extrabold tracking-tight">Precios sencillos, sin permanencia</h1>
        <p className="mx-auto mb-12 mt-4 max-w-xl text-center text-slate-600">
          Empieza gratis con 5 presupuestos al mes. Cuando lo uses a diario, pasa a Pro por 9,90 €/mes (IVA incluido).
        </p>
        <Pricing />
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="mb-8 text-center text-2xl font-bold">Preguntas frecuentes</h2>
        <Faq />
      </section>
    </div>
  );
}
