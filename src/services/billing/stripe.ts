import "server-only";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { ACTIVE_STATUSES } from "@/lib/plans";
import { track } from "../analytics";
import { audit } from "../audit";

let stripeClient: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (stripeClient !== undefined) return stripeClient;
  const key = env.stripe.secretKey;
  stripeClient = key ? new Stripe(key, { maxNetworkRetries: 2, timeout: 20_000 }) : null;
  return stripeClient;
}

export function isBillingEnabled() {
  return Boolean(env.stripe.secretKey && env.stripe.proPriceId);
}

function requireStripe() {
  const stripe = getStripe();
  if (!stripe || !env.stripe.proPriceId) {
    throw new AppError("Los pagos no están disponibles ahora mismo. Escríbenos y te ayudamos.", "UNAVAILABLE");
  }
  return stripe;
}

async function ensureCustomer(stripe: Stripe, user: { id: string; email: string; name: string }) {
  const sub = await db.subscription.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  if (sub.stripeCustomerId) return sub.stripeCustomerId;
  const customer = await stripe.customers.create(
    { email: user.email, name: user.name, metadata: { userId: user.id } },
    { idempotencyKey: `customer-${user.id}` },
  );
  await db.subscription.update({ where: { userId: user.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function createCheckoutSession(user: { id: string; email: string; name: string }) {
  const stripe = requireStripe();
  const current = await db.subscription.findUnique({ where: { userId: user.id } });
  if (current?.plan === "PRO" && ACTIVE_STATUSES.has(current.status)) {
    throw new AppError("Ya tienes el plan Pro activo.", "CONFLICT");
  }
  const customer = await ensureCustomer(stripe, user);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price: env.stripe.proPriceId!, quantity: 1 }],
    subscription_data: { metadata: { userId: user.id } },
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    tax_id_collection: { enabled: true },
    customer_update: { name: "auto", address: "auto" },
    locale: "es",
    success_url: `${env.appUrl}/panel/suscripcion?estado=ok`,
    cancel_url: `${env.appUrl}/panel/suscripcion?estado=cancelado`,
  });
  if (!session.url) throw new AppError("No hemos podido abrir la página de pago. Inténtalo de nuevo.", "UNAVAILABLE");
  return session.url;
}

export async function createPortalSession(userId: string) {
  const stripe = requireStripe();
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeCustomerId) throw new AppError("Todavía no tienes ninguna suscripción de pago.", "NOT_FOUND");
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${env.appUrl}/panel/suscripcion`,
    locale: "es",
  });
  return portal.url;
}

// ───────────── Webhooks ─────────────

export function verifyWebhook(rawBody: string, signature: string | null): Stripe.Event {
  const stripe = getStripe();
  const secret = env.stripe.webhookSecret;
  if (!stripe || !secret) throw new AppError("Webhook no configurado", "UNAVAILABLE");
  if (!signature) throw new AppError("Falta la firma", "FORBIDDEN");
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    throw new AppError("Firma no válida", "FORBIDDEN");
  }
}

/** Sincroniza nuestra tabla con el estado REAL de la suscripción en Stripe. */
export async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const metaUserId = subscription.metadata?.userId;

  const existing = await db.subscription.findFirst({
    where: { OR: [{ stripeCustomerId: customerId }, ...(metaUserId ? [{ userId: metaUserId }] : [])] },
  });
  if (!existing) {
    console.warn(`[stripe] Suscripción ${subscription.id} sin usuario asociado`);
    return;
  }

  const item = subscription.items.data[0];
  const priceId = item?.price.id ?? null;
  const isPro = priceId === env.stripe.proPriceId && ACTIVE_STATUSES.has(subscription.status);
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null;

  const wasActive = existing.plan === "PRO" && ACTIVE_STATUSES.has(existing.status);
  await db.subscription.update({
    where: { id: existing.id },
    data: {
      plan: isPro ? "PRO" : "FREE",
      status: subscription.status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  if (!wasActive && isPro) {
    await track("subscription_started", existing.userId);
    await audit(existing.userId, "subscription.started", "Subscription", subscription.id);
  }
  if ((wasActive && !isPro) || (subscription.cancel_at_period_end && !existing.cancelAtPeriodEnd)) {
    await track("subscription_cancelled", existing.userId, { immediate: !isPro });
    await audit(existing.userId, "subscription.cancelled", "Subscription", subscription.id, { status: subscription.status });
  }
}

const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "invoice.payment_failed",
  "invoice.paid",
]);

export async function handleStripeEvent(event: Stripe.Event, stripe: Stripe | null = getStripe()) {
  if (!HANDLED.has(event.type)) return "ignored" as const;

  // Idempotencia: Stripe puede reenviar el mismo evento.
  try {
    await db.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch {
    return "duplicate" as const;
  }

  try {
    const obj = event.data.object as unknown as Record<string, unknown>;
    let subscriptionId: string | null = null;

    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      subscriptionId = typeof s.subscription === "string" ? s.subscription : (s.subscription?.id ?? null);
      // Vincula el cliente de Stripe al usuario si aún no lo estaba.
      const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
      if (s.client_reference_id && customerId) {
        await db.subscription.upsert({
          where: { userId: s.client_reference_id },
          create: { userId: s.client_reference_id, stripeCustomerId: customerId },
          update: { stripeCustomerId: customerId },
        });
      }
    } else if (event.type.startsWith("customer.subscription.")) {
      subscriptionId = obj.id as string;
    } else if (event.type.startsWith("invoice.")) {
      const parent = obj.parent as { subscription_details?: { subscription?: string | { id: string } } } | null;
      const sub = parent?.subscription_details?.subscription;
      subscriptionId = typeof sub === "string" ? sub : (sub?.id ?? null);
    }

    if (subscriptionId && stripe) {
      // Siempre leemos el estado actual desde Stripe (no confiamos en el orden de los eventos).
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscription(subscription);
    }
    return "processed" as const;
  } catch (error) {
    // Permite que el reintento de Stripe vuelva a procesarlo.
    await db.stripeEvent.delete({ where: { id: event.id } }).catch(() => {});
    throw error;
  }
}
