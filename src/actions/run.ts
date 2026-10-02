import "server-only";
import { headers } from "next/headers";
import { ZodError } from "zod";
import { fieldErrors } from "@/validation/common";
import { logError, userMessage, type ActionResult } from "@/lib/errors";

/** Envuelve una acción: errores de validación por campo y mensajes comprensibles. Nunca filtra errores técnicos. */
export async function run<T>(context: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: "Revisa los campos marcados.", fieldErrors: fieldErrors(error) };
    }
    logError(context, error);
    return { ok: false, error: userMessage(error) };
  }
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
