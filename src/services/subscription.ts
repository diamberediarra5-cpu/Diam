import "server-only";
import { db } from "@/lib/db";
import { startOfMonthUtc } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { ACTIVE_STATUSES, PLANS, type PlanConfig } from "@/lib/plans";

type DbLike = Pick<typeof db, "subscription" | "quote" | "aiUsage">;

/** Plan efectivo: solo es Pro si Stripe dice que la suscripción está activa. */
export async function getPlan(userId: string, client: DbLike = db): Promise<PlanConfig> {
  const sub = await client.subscription.findUnique({ where: { userId } });
  if (sub && sub.plan === "PRO" && ACTIVE_STATUSES.has(sub.status)) return PLANS.PRO;
  return PLANS.FREE;
}

export async function getUsage(userId: string, client: DbLike = db) {
  const since = startOfMonthUtc();
  const [quotes, ai] = await Promise.all([
    client.quote.count({ where: { userId, createdAt: { gte: since } } }),
    client.aiUsage.count({ where: { userId, success: true, createdAt: { gte: since } } }),
  ]);
  return { quotes, ai };
}

export async function getPlanAndUsage(userId: string) {
  const [plan, usage, subscription] = await Promise.all([
    getPlan(userId),
    getUsage(userId),
    db.subscription.findUnique({ where: { userId } }),
  ]);
  return { plan, usage, subscription };
}

export async function assertCanCreateQuote(userId: string, client: DbLike = db) {
  const plan = await getPlan(userId, client);
  if (plan.quotesPerMonth === null) return;
  const { quotes } = await getUsage(userId, client);
  if (quotes >= plan.quotesPerMonth) {
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
