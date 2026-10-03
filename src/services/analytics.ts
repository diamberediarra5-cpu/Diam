import "server-only";
import { db } from "@/lib/db";
import { logError } from "@/lib/errors";

export type AnalyticsEventName =
  | "signup"
  | "login"
  | "onboarding_completed"
  | "main_action_started"
  | "main_action_completed"
  | "ai_generated"
  | "quote_shared"
  | "quote_accepted"
  | "quote_rejected"
  | "upgrade_clicked"
  | "subscription_started"
  | "subscription_cancelled";

/**
 * Analítica propia y mínima: nombre del evento + usuario + props sin datos personales.
 * Nunca rompe el flujo principal.
 */
export async function track(name: AnalyticsEventName, userId?: string | null, props?: Record<string, string | number | boolean>) {
  try {
    await db.analyticsEvent.create({ data: { name, userId: userId ?? null, props } });
  } catch (error) {
    logError("analytics", error);
  }
}
