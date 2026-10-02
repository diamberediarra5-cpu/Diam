export const FAQS = [
  {
    q: "¿Necesito saber de informática?",
    a: "No. Si sabes mandar un WhatsApp, sabes usar Presupuéstalo. Escribes qué trabajo vas a hacer, revisas los precios y le das a enviar.",
  },
  {
    q: "¿La IA pone los precios por mí?",
    a: "Propone partidas y precios orientativos para que no empieces de cero, pero el precio final siempre lo decides tú. Puedes cambiar cualquier línea antes de guardar.",
  },
  {
    q: "¿Cómo recibe el presupuesto mi cliente?",
    a: "Le llega un enlace por WhatsApp (o por donde quieras). Lo abre en el móvil sin instalar nada, lo ve con tus datos y lo acepta con un botón. Tú ves en tu panel si lo ha visto y si lo ha aceptado.",
  },
  {
    q: "¿Puedo descargarlo en PDF?",
    a: "Sí. Desde el presupuesto, pulsa «Imprimir / PDF» y elige «Guardar como PDF». Tu cliente también puede descargarlo.",
  },
  {
    q: "¿Calcula el IVA y la retención de IRPF?",
    a: "Sí. Eliges el tipo de IVA (21 %, 10 % para reformas de vivienda, 4 % o exento) y, si trabajas para empresas, la retención de IRPF. Los totales se calculan solos.",
  },
  {
    q: "¿Sirve para hacer facturas?",
    a: "Por ahora no: Presupuéstalo está centrado en que hagas presupuestos rápido y cierres más trabajos. La conversión de presupuesto a factura está en nuestra hoja de ruta.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. No hay permanencia. Cancelas desde tu panel en un clic y sigues con Pro hasta el final del mes pagado. Después vuelves al plan Gratis sin perder tus presupuestos.",
  },
  {
    q: "¿Dónde se guardan mis datos?",
    a: "En servidores dentro de la Unión Europea, cumpliendo el RGPD. No vendemos ni compartimos tus datos ni los de tus clientes.",
  },
];

export function Faq() {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-line rounded-2xl border border-line bg-white">
      {FAQS.map((f) => (
        <details key={f.q} className="group px-5 py-4 sm:px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
            {f.q}
            <span className="text-brand-700 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <p className="mt-2 text-sm text-slate-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
