import type { Metadata } from "next";
import { Faq, FAQS } from "@/components/marketing/faq";
import { Pricing } from "@/components/marketing/pricing";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Presupuéstalo — Programa de presupuestos para autónomos, desde el móvil" },
  description:
    "Haz presupuestos profesionales en 2 minutos desde el móvil. La IA redacta las partidas, calcula IVA e IRPF y tu cliente lo acepta online por WhatsApp. Gratis para empezar.",
  alternates: { canonical: "/" },
};

const PAINS = [
  {
    title: "Presupuestos a las 11 de la noche",
    text: "Terminas la obra, llegas a casa y todavía te toca pelearte con Word o Excel. Cada presupuesto se come entre 20 minutos y una hora.",
  },
  {
    title: "Pierdes trabajos por tardar",
    text: "El cliente pidió tres presupuestos. El primero que llega con buena pinta suele ganar. Si mandas el tuyo dos días después, llegas tarde.",
  },
  {
    title: "No sabes si lo han visto",
    text: "Lo mandas como foto por WhatsApp y silencio. ¿Lo ha abierto? ¿Lo llamas o esperas? No tienes forma de saberlo.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Describe el trabajo",
    text: "«Cambiar bañera por plato de ducha de 120x80 con mampara». Escrito como lo dirías tú, desde el móvil, a pie de obra.",
  },
  {
    n: "2",
    title: "Revisa partidas y precios",
    text: "La IA propone las partidas separando material y mano de obra. Ajustas cantidades y precios. El IVA y el total se calculan solos.",
  },
  {
    n: "3",
    title: "Envíalo por WhatsApp",
    text: "Tu cliente recibe un enlace, ve un presupuesto profesional con tus datos y lo acepta con un clic. Tú lo ves al momento en tu panel.",
  },
];

const BENEFITS = [
  ["Ahorra horas cada semana", "De 30 minutos a 2 minutos por presupuesto. Si haces 20 al mes, son más de 9 horas libres."],
  ["Imagen profesional", "Presupuesto limpio con tus datos, NIF, partidas, IVA y condiciones. Nada de fotos de una libreta."],
  ["Sin errores de cálculo", "IVA del 21 %, 10 % o 4 % y retención de IRPF aplicados automáticamente, redondeados al céntimo."],
  ["Sabes en qué punto está", "Borrador, enviado, visto, aceptado o rechazado. Sabes a quién llamar y cuándo."],
  ["Desde el móvil", "Diseñado para usarlo en la furgoneta o en casa del cliente. Funciona igual en el ordenador."],
  ["Tus clientes, ordenados", "Cada cliente se guarda solo. El siguiente presupuesto para él lo haces aún más rápido."],
];

function QuoteMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-100 to-white blur-sm" />
      <div className="rounded-2xl border border-line bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between border-b border-line pb-3">
          <div>
            <p className="text-sm font-bold">Reformas Ruiz</p>
            <p className="text-xs text-muted">NIF 12345678Z · Valencia</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-700">Presupuesto</p>
            <p className="text-sm font-bold">Nº 2026-0042</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">Cliente</p>
        <p className="text-sm font-semibold">María García · Reforma de baño</p>
        <ul className="mt-3 space-y-2 text-xs">
          {[
            ["Retirada de bañera y escombros", "180,00 €"],
            ["Plato de ducha 120x80 antideslizante", "245,00 €"],
            ["Mampara de cristal templado", "310,00 €"],
            ["Mano de obra fontanería (8 h)", "280,00 €"],
          ].map(([d, p]) => (
            <li key={d} className="flex justify-between gap-2 border-b border-line pb-2">
              <span>{d}</span>
              <span className="font-semibold tabular-nums">{p}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 text-xs">
          <div className="flex justify-between text-muted">
            <span>IVA 10 %</span>
            <span>101,50 €</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>1.116,50 €</span>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-brand-700 py-2.5 text-center text-sm font-semibold text-white">Aceptar presupuesto</div>
      </div>
      <div className="absolute -right-2 -top-4 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-lg sm:-right-6">✓ Aceptado hace 5 min</div>
    </div>
  );
}

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: site.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: site.url,
        description: site.description,
        offers: [
          { "@type": "Offer", price: "0", priceCurrency: "EUR", name: "Gratis" },
          { "@type": "Offer", price: "9.90", priceCurrency: "EUR", name: "Pro (mensual)" },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <>
      {/* JSON-LD estático (sin datos de usuario) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <section className="overflow-hidden bg-gradient-to-b from-brand-50/60 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="mb-4 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
              Para autónomos de reformas, fontanería, electricidad y talleres
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Deja de hacer presupuestos <span className="text-brand-700">por la noche.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Con {site.name} haces un presupuesto profesional en <strong className="text-ink">2 minutos desde el móvil</strong>: describes el trabajo, la IA
              redacta las partidas, el IVA se calcula solo y tu cliente lo acepta por WhatsApp con un clic.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/registro" size="lg">
                Hacer mi primer presupuesto gratis
              </ButtonLink>
              <ButtonLink href="#como-funciona" variant="secondary" size="lg">
                Ver cómo funciona
              </ButtonLink>
            </div>
            <p className="mt-3 text-sm text-muted">Sin tarjeta · 5 presupuestos gratis al mes · En español</p>
          </div>
          <QuoteMockup />
        </div>
      </section>

      {/* Problema */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="problema">
        <h2 id="problema" className="max-w-2xl text-3xl font-bold tracking-tight">
          Hacer presupuestos te quita tiempo y te hace perder trabajos
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {PAINS.map((p) => (
            <div key={p.title} className="rounded-xl border border-line bg-white p-6">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solución / cómo funciona */}
      <section id="como-funciona" className="scroll-mt-20 bg-surface" aria-labelledby="como">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-sm font-semibold text-brand-700">La solución</p>
          <h2 id="como" className="mt-1 max-w-2xl text-3xl font-bold tracking-tight">
            Un presupuesto profesional en 3 pasos, sin plantillas ni fórmulas
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-xl border border-line bg-white p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 font-bold text-white">{s.n}</span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Beneficios */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="beneficios">
        <h2 id="beneficios" className="max-w-2xl text-3xl font-bold tracking-tight">
          Lo que ganas desde el primer presupuesto
        </h2>
        <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(([t, d]) => (
            <div key={t} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800" aria-hidden="true">
                ✓
              </span>
              <div>
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-slate-600">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="scroll-mt-20 bg-surface" aria-labelledby="precios-h">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="precios-h" className="text-center text-3xl font-bold tracking-tight">
            Precio claro. Menos que un café a la semana.
          </h2>
          <p className="mx-auto mb-10 mt-3 max-w-xl text-center text-slate-600">
            Empieza gratis. Si cierras un solo trabajo más al mes gracias a responder antes, Pro ya se ha pagado.
          </p>
          <Pricing />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="faq">
        <h2 id="faq" className="mb-8 text-center text-3xl font-bold tracking-tight">
          Preguntas frecuentes
        </h2>
        <Faq />
      </section>

      {/* CTA final */}
      <section className="bg-brand-800">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">Tu próximo presupuesto, en 2 minutos</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">Crea tu cuenta, describe el trabajo y envíalo hoy mismo. Gratis, sin tarjeta.</p>
          <ButtonLink href="/registro" size="lg" variant="secondary" className="mt-8">
            Empezar gratis ahora
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
