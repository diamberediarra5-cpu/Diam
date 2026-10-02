"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession, requireUser } from "@/lib/session";
import { track } from "@/services/analytics";
import { generateQuoteItems } from "@/services/ai/quote-generator";
import {
  createQuote,
  deleteQuote,
  duplicateQuote,
  markShared,
  markViewed,
  respondToQuote,
  setQuoteStatus,
  updateQuote,
} from "@/services/quotes";
import { enforceRateLimit } from "@/services/rate-limit";
import type { QuoteInput } from "@/validation/quote";
import { clientIp, run } from "./run";

const idSchema = z.string().min(1).max(40);
const statusSchema = z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED"]);

function revalidateQuotes(id?: string) {
  revalidatePath("/panel");
  revalidatePath("/panel/presupuestos");
  if (id) revalidatePath(`/panel/presupuestos/${id}`);
}

export async function saveQuoteAction(id: string | null, input: QuoteInput) {
  const user = await requireUser();
  return run("quotes.save", async () => {
    const quote = id ? await updateQuote(user.id, idSchema.parse(id), input) : await createQuote(user.id, input);
    revalidateQuotes(quote.id);
    return { id: quote.id };
  });
}

export async function deleteQuoteAction(id: string) {
  const user = await requireUser();
  return run("quotes.delete", async () => {
    await deleteQuote(user.id, idSchema.parse(id));
    revalidateQuotes();
    return undefined;
  });
}

export async function duplicateQuoteAction(id: string) {
  const user = await requireUser();
  return run("quotes.duplicate", async () => {
    const copy = await duplicateQuote(user.id, idSchema.parse(id));
    revalidateQuotes();
    return { id: copy.id };
  });
}

export async function setQuoteStatusAction(id: string, status: string) {
  const user = await requireUser();
  return run("quotes.status", async () => {
    await setQuoteStatus(user.id, idSchema.parse(id), statusSchema.parse(status));
    revalidateQuotes(id);
    return undefined;
  });
}

export async function markSharedAction(id: string) {
  const user = await requireUser();
  return run("quotes.shared", async () => {
    await markShared(user.id, idSchema.parse(id));
    revalidateQuotes(id);
    return undefined;
  });
}

export async function generateItemsAction(input: { description: string }) {
  const user = await requireUser();
  return run("quotes.ai", () => generateQuoteItems(user.id, input));
}

export async function trackEventAction(name: "main_action_started" | "upgrade_clicked") {
  const user = await requireUser();
  if (name === "main_action_started" || name === "upgrade_clicked") await track(name, user.id);
}

/** Acción pública: el cliente final acepta o rechaza. Sin sesión; protegida por token + rate limit. */
export async function respondToQuoteAction(token: string, decision: "ACCEPTED" | "REJECTED") {
  return run("quotes.respond", async () => {
    const t = z.string().min(20).max(64).parse(token);
    const d = z.enum(["ACCEPTED", "REJECTED"]).parse(decision);
    await enforceRateLimit(`respond:${await clientIp()}`, 10, 10 * 60_000);
    await respondToQuote(t, d);
    revalidatePath(`/p/${t}`);
    return undefined;
  });
}

/** Pública: marca el presupuesto como visto (no cuenta si lo abre el propio autónomo). */
export async function markViewedAction(token: string) {
  const t = z.string().min(20).max(64).safeParse(token);
  if (!t.success) return;
  const session = await getSession();
  await markViewed(t.data, session?.user.id);
}
