import Stripe from "stripe";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as webhookRoute } from "@/app/api/stripe/webhook/route";
import { db } from "@/lib/db";
import { handleStripeEvent, verifyWebhook } from "@/services/billing/stripe";
import { getPlan } from "@/services/subscription";
import { createUser, resetDb } from "../setup/db";

const stripe = new Stripe("sk_test_dummy");
const SECRET = "whsec_test_dummy";

function sign(payload: string) {
  return stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
}

function subscriptionObject(opts: { customer: string; status: string; userId?: string; cancelAtPeriodEnd?: boolean; price?: string }) {
  return {
    id: "sub_123",
    object: "subscription",
    customer: opts.customer,
    status: opts.status,
    cancel_at_period_end: opts.cancelAtPeriodEnd ?? false,
    metadata: opts.userId ? { userId: opts.userId } : {},
    items: { data: [{ price: { id: opts.price ?? "price_pro_test" }, current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400 }] },
  } as unknown as Stripe.Subscription;
}

function event(id: string, type: string, object: unknown) {
  return { id, type, object: "event", data: { object } } as unknown as Stripe.Event;
}

/** Stripe simulado: devuelve el estado "real" de la suscripción. */
function stripeStub(sub: Stripe.Subscription) {
  return { subscriptions: { retrieve: async () => sub } } as unknown as Stripe;
}

describe("Stripe", () => {
  beforeEach(resetDb);

  describe("verificación de webhooks", () => {
    it("acepta una firma válida", () => {
      const payload = JSON.stringify({ id: "evt_1", type: "ping", object: "event", data: { object: {} } });
      expect(verifyWebhook(payload, sign(payload)).id).toBe("evt_1");
    });

    it("rechaza firma ausente, inválida o payload manipulado", () => {
      const payload = JSON.stringify({ id: "evt_1", type: "ping" });
      expect(() => verifyWebhook(payload, null)).toThrow();
      expect(() => verifyWebhook(payload, "t=1,v1=deadbeef")).toThrow();
      expect(() => verifyWebhook(payload.replace("evt_1", "evt_2"), sign(payload))).toThrow();
    });

    it("la ruta responde 400 ante firmas falsas y 200 ante eventos válidos", async () => {
      const bad = await webhookRoute(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: "{}", headers: { "stripe-signature": "t=1,v1=x" } }));
      expect(bad.status).toBe(400);
      const payload = JSON.stringify({ id: "evt_ok", type: "customer.created", object: "event", data: { object: {} } });
      const ok = await webhookRoute(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: payload, headers: { "stripe-signature": sign(payload) } }));
      expect(ok.status).toBe(200);
      expect(await ok.json()).toMatchObject({ result: "ignored" });
    });
  });

  describe("sincronización de la suscripción", () => {
    it("activa Pro, lo mantiene si se programa la cancelación y vuelve a Gratis al cancelarse", async () => {
      const u = await createUser();
      await db.subscription.update({ where: { userId: u.id }, data: { stripeCustomerId: "cus_1" } });
      expect((await getPlan(u.id)).key).toBe("FREE");

      const active = subscriptionObject({ customer: "cus_1", status: "active", userId: u.id });
      expect(await handleStripeEvent(event("evt_a", "customer.subscription.created", active), stripeStub(active))).toBe("processed");
      expect((await getPlan(u.id)).key).toBe("PRO");
      const sub = await db.subscription.findUniqueOrThrow({ where: { userId: u.id } });
      expect(sub.stripeSubscriptionId).toBe("sub_123");
      expect(sub.currentPeriodEnd).not.toBeNull();

      const cancelling = subscriptionObject({ customer: "cus_1", status: "active", cancelAtPeriodEnd: true });
      await handleStripeEvent(event("evt_b", "customer.subscription.updated", cancelling), stripeStub(cancelling));
      expect((await getPlan(u.id)).key).toBe("PRO");
      expect((await db.subscription.findUniqueOrThrow({ where: { userId: u.id } })).cancelAtPeriodEnd).toBe(true);

      const canceled = subscriptionObject({ customer: "cus_1", status: "canceled" });
      await handleStripeEvent(event("evt_c", "customer.subscription.deleted", canceled), stripeStub(canceled));
      expect((await getPlan(u.id)).key).toBe("FREE");

      const names = (await db.analyticsEvent.findMany({ where: { userId: u.id } })).map((e) => e.name);
      expect(names).toContain("subscription_started");
      expect(names).toContain("subscription_cancelled");
    });

    it("usa el estado real de Stripe, no el del evento (orden de eventos irrelevante)", async () => {
      const u = await createUser();
      await db.subscription.update({ where: { userId: u.id }, data: { stripeCustomerId: "cus_2" } });
      const staleEventPayload = subscriptionObject({ customer: "cus_2", status: "active" });
      const realState = subscriptionObject({ customer: "cus_2", status: "canceled" });
      await handleStripeEvent(event("evt_x", "customer.subscription.updated", staleEventPayload), stripeStub(realState));
      expect((await getPlan(u.id)).key).toBe("FREE");
    });

    it("checkout.session.completed vincula el cliente de Stripe al usuario", async () => {
      const u = await createUser();
      const active = subscriptionObject({ customer: "cus_3", status: "active", userId: u.id });
      const session = { id: "cs_1", object: "checkout.session", client_reference_id: u.id, customer: "cus_3", subscription: "sub_123" };
      await handleStripeEvent(event("evt_cs", "checkout.session.completed", session), stripeStub(active));
      const sub = await db.subscription.findUniqueOrThrow({ where: { userId: u.id } });
      expect(sub.stripeCustomerId).toBe("cus_3");
      expect(sub.plan).toBe("PRO");
    });

    it("un precio distinto del plan Pro no da acceso Pro", async () => {
      const u = await createUser();
      await db.subscription.update({ where: { userId: u.id }, data: { stripeCustomerId: "cus_4" } });
      const other = subscriptionObject({ customer: "cus_4", status: "active", price: "price_otro" });
      await handleStripeEvent(event("evt_p", "customer.subscription.created", other), stripeStub(other));
      expect((await getPlan(u.id)).key).toBe("FREE");
    });

    it("idempotencia: el mismo evento se procesa una vez", async () => {
      const u = await createUser();
      await db.subscription.update({ where: { userId: u.id }, data: { stripeCustomerId: "cus_5" } });
      const active = subscriptionObject({ customer: "cus_5", status: "active" });
      expect(await handleStripeEvent(event("evt_dup", "customer.subscription.created", active), stripeStub(active))).toBe("processed");
      expect(await handleStripeEvent(event("evt_dup", "customer.subscription.created", active), stripeStub(active))).toBe("duplicate");
    });

    it("si falla el procesamiento, el evento se puede reintentar", async () => {
      const u = await createUser();
      await db.subscription.update({ where: { userId: u.id }, data: { stripeCustomerId: "cus_6" } });
      const broken = { subscriptions: { retrieve: async () => { throw new Error("red caída"); } } } as unknown as Stripe;
      const active = subscriptionObject({ customer: "cus_6", status: "active" });
      await expect(handleStripeEvent(event("evt_retry", "customer.subscription.created", active), broken)).rejects.toThrow();
      expect(await handleStripeEvent(event("evt_retry", "customer.subscription.created", active), stripeStub(active))).toBe("processed");
      expect((await getPlan(u.id)).key).toBe("PRO");
    });
  });
});
