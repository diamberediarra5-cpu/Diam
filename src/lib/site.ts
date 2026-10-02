export const site = {
  name: "Presupuéstalo",
  tagline: "Presupuestos profesionales en 2 minutos, desde el móvil",
  description:
    "Haz presupuestos profesionales para tus clientes en minutos. La IA redacta las partidas, calcula el IVA y tu cliente lo acepta online con un clic. Para autónomos y reformas.",
  url: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hola@presupuestalo.es",
  legalOwner: process.env.NEXT_PUBLIC_LEGAL_OWNER ?? "[Titular del servicio]",
  legalTaxId: process.env.NEXT_PUBLIC_LEGAL_TAX_ID ?? "[NIF]",
} as const;
