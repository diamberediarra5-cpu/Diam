import "server-only";
import { db } from "@/lib/db";
import { startOfMonthUtc } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { ACTIVE_STATUSES, PLANS, type PlanConfig } from "@/lib/plans";

type DbLike = Pick<typeof db, "subscription" | "usageCounter" | "aiUsage">;

export function currentPeriod(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

/** Plan efectivo: solo es Pro si Stripe dice que la suscripción está activa. */
export async function getPlan(userId: string, client: DbLike = db): Promise<PlanConfig> {
  const sub = await client.subscription.findUnique({ where: { userId } });
  if (sub && sub.plan === "PRO" && ACTIVE_STATUSES.has(sub.status)) return PLANS.PRO;
  return PLANS.FREE;
}

export async function getUsage(userId: string, client: DbLike = db) {
  const since = startOfMonthUtc();
  const [counter, ai] = await Promise.all([
    client.usageCounter.findUnique({ where: { userId_period: { userId, period: currentPeriod() } } }),
    client.aiUsage.count({ where: { userId, success: true, createdAt: { gte: since } } }),
  ]);
  return { quotes: counter?.quotesCreated ?? 0, ai };
}

export async function getPlanAndUsage(userId: string) {
  const [plan, usage, subscription] = await Promise.all([
    getPlan(userId),
    getUsage(userId),
    db.subscription.findUnique({ where: { userId } }),
  ]);
  return { plan, usage, subscription };
}

/**
 * Reserva un presupuesto del cupo mensual (incremento atómico) y falla si se supera el límite.
 * Debe llamarse dentro de la transacción que crea el presupuesto: si algo falla, se deshace.
 */
export async function consumeQuoteQuota(userId: string, client: DbLike = db) {
  const plan = await getPlan(userId, client);
  const period = currentPeriod();
  const counter = await client.usageCounter.upsert({
    where: { userId_period: { userId, period } },
    create: { userId, period, quotesCreated: 1 },
    update: { quotesCreated: { increment: 1 } },
  });
  if (plan.quotesPerMonth !== null && counter.quotesCreated > plan.quotesPerMonth) {
    throw new AppError(
      `Has llegado al límite de ${plan.quotesPerMonth} presupuestos este mes del plan Gratis. Pasa a Pro para crear presupuestos ilimitados.`,
      "LIMIT_REACHED",
    );
  }
}

export async function assertCanUseAi(userId: string) {
  const plan = await getPlan(userId);
  const { ai } = await getUsage(userId);
  if (ai >= plan.aiPerMonth) {
    throw new AppError(
      plan.key === "FREE"
        ? `Has usado tus ${plan.aiPerMonth} generaciones con IA de este mes. Pasa a Pro para tener ${PLANS.PRO.aiPerMonth} al mes.`
        : `Has usado tus ${plan.aiPerMonth} generaciones con IA de este mes. Se renuevan el día 1.`,
      "LIMIT_REACHED",
    );
  }
}
