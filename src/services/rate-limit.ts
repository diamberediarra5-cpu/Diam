import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";

/**
 * Rate limit de ventana fija guardado en Postgres (funciona en serverless, sin Redis).
 * Usa la misma tabla que Better Auth con claves prefijadas "app:".
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<{ ok: boolean; remaining: number }> {
  const fullKey = `app:${key}`;
  const now = Date.now();
  const windowStart = BigInt(now - windowMs);

  // Una única sentencia atómica: reinicia la ventana si ha caducado o incrementa el contador.
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "rate_limit" ("id", "key", "count", "lastRequest")
    VALUES (${crypto.randomUUID()}, ${fullKey}, 1, ${BigInt(now)})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "rate_limit"."lastRequest" < ${windowStart} THEN 1 ELSE "rate_limit"."count" + 1 END,
      "lastRequest" = CASE WHEN "rate_limit"."lastRequest" < ${windowStart} THEN ${BigInt(now)} ELSE "rate_limit"."lastRequest" END
    RETURNING "count"`;
  const count = Number(rows[0]?.count ?? 1);
  return { ok: count <= max, remaining: Math.max(0, max - count) };
}

export async function enforceRateLimit(key: string, max: number, windowMs: number) {
  const { ok } = await rateLimit(key, max, windowMs);
  if (!ok) throw new AppError("Demasiados intentos. Espera un momento y vuelve a probar.", "RATE_LIMITED");
}
