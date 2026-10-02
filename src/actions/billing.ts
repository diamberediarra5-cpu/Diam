"use server";

import { requireUser } from "@/lib/session";
import { track } from "@/services/analytics";
import { createCheckoutSession, createPortalSession } from "@/services/billing/stripe";
import { run } from "./run";

export async function startCheckoutAction() {
  const user = await requireUser();
  return run("billing.checkout", async () => {
    await track("upgrade_clicked", user.id);
    return { url: await createCheckoutSession(user) };
  });
}

export async function openPortalAction() {
  const user = await requireUser();
  return run("billing.portal", async () => ({ url: await createPortalSession(user.id) }));
}
