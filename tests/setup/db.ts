import { db } from "@/lib/db";

/** Vacía todas las tablas entre tests. */
export async function resetDb() {
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE "quote_item", "quote", "client", "business_profile", "subscription", "ai_usage",
      "audit_log", "usage_counter", "analytics_event", "stripe_event", "contact_message", "rate_limit",
      "session", "account", "verification", "user" RESTART IDENTITY CASCADE`);
}

let counter = 0;

/** Crea un usuario directamente en BD (para tests de servicios). */
export async function createUser(opts: { onboard?: boolean; plan?: "FREE" | "PRO" } = {}) {
  counter += 1;
  const id = `user_${Date.now()}_${counter}`;
  const user = await db.user.create({ data: { id, name: `Usuario ${counter}`, email: `u${counter}_${Date.now()}@test.es` } });
  await db.subscription.create({
    data: { userId: id, plan: opts.plan ?? "FREE", status: opts.plan === "PRO" ? "active" : "inactive" },
  });
  if (opts.onboard !== false) {
    await db.businessProfile.create({ data: { userId: id, businessName: `Negocio ${counter}`, onboardedAt: new Date() } });
  }
  return user;
}

export const sampleQuote = (overrides: Record<string, unknown> = {}) => ({
  client: { name: "María García", phone: "600111222" },
  saveClient: true,
  title: "Reforma de baño",
  validUntil: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
  vatRate: 10,
  irpfRate: 0,
  notes: "Pago 50 % al inicio",
  items: [
    { description: "Plato de ducha 120x80", quantity: 1, unit: "ud", unitPrice: 245 },
    { description: "Mano de obra", quantity: 8, unit: "h", unitPrice: 35 },
  ],
  ...overrides,
});
