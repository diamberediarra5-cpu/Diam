export type PlanKey = "FREE" | "PRO";

export type PlanConfig = {
  key: PlanKey;
  name: string;
  priceLabel: string;
  priceCents: number;
  quotesPerMonth: number | null; // null = ilimitado
  aiPerMonth: number;
  branding: boolean;
  features: string[];
};

export const PLANS: Record<PlanKey, PlanConfig> = {
  FREE: {
    key: "FREE",
    name: "Gratis",
    priceLabel: "0 €",
    priceCents: 0,
    quotesPerMonth: 5,
    aiPerMonth: 3,
    branding: true,
    features: [
      "5 presupuestos nuevos al mes",
      "3 presupuestos redactados con IA al mes",
      "Enlace para que tu cliente acepte online",
      "Clientes ilimitados",
    ],
  },
  PRO: {
    key: "PRO",
    name: "Pro",
    priceLabel: "9,90 €",
    priceCents: 990,
    quotesPerMonth: null,
    aiPerMonth: 100,
    branding: false,
    features: [
      "Presupuestos ilimitados",
      "100 presupuestos redactados con IA al mes",
      "Sin marca de Presupuéstalo en tus presupuestos",
      "Soporte prioritario por email",
    ],
  },
};

/** Estados de Stripe que dan acceso a Pro. */
export const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);
