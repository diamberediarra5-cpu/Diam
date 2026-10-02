import "server-only";

/** Lee una variable obligatoria. Falla en tiempo de ejecución (no en build) si falta. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get authSecret() {
    return required("BETTER_AUTH_SECRET");
  },
  get appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  },
  stripe: {
    get secretKey() {
      return process.env.STRIPE_SECRET_KEY;
    },
    get webhookSecret() {
      return process.env.STRIPE_WEBHOOK_SECRET;
    },
    get proPriceId() {
      return process.env.STRIPE_PRICE_PRO_MONTHLY;
    },
  },
  email: {
    get resendApiKey() {
      return process.env.RESEND_API_KEY;
    },
    get from() {
      return process.env.EMAIL_FROM ?? "Presupuéstalo <no-reply@presupuestalo.es>";
    },
    get contactInbox() {
      return process.env.CONTACT_INBOX;
    },
  },
  ai: {
    /** "anthropic" | "mock" | vacío (desactivada) */
    get provider() {
      return process.env.AI_PROVIDER ?? (process.env.ANTHROPIC_API_KEY ? "anthropic" : "");
    },
    get anthropicApiKey() {
      return process.env.ANTHROPIC_API_KEY;
    },
    get model() {
      return process.env.AI_MODEL ?? "claude-opus-5-5";
    },
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
};
