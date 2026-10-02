import { z } from "zod";

/** Texto opcional: "" → undefined, recortado, con longitud máxima. */
export const optionalText = (max: number, label = "Este campo") =>
  z
    .string()
    .trim()
    .max(max, `${label} es demasiado largo (máx. ${max} caracteres)`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v ? v.toLowerCase() : undefined))
  .refine((v) => !v || z.email().safeParse(v).success, "El email no es válido");

/** NIF/NIE/CIF: validación de formato flexible (no bloqueamos a extranjeros). */
export const optionalTaxId = z
  .string()
  .trim()
  .max(20, "El NIF es demasiado largo")
  .optional()
  .transform((v) => (v ? v.toUpperCase().replace(/[\s-]/g, "") : undefined));

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Convierte undefined → null para que al vaciar un campo opcional se borre en BD (Prisma ignora undefined). */
export function nullifyOptional<T extends Record<string, unknown>>(
  data: T,
  keys: readonly string[],
): { [K in keyof T]: undefined extends T[K] ? Exclude<T[K], undefined> | null : T[K] } {
  // Recorremos las claves del esquema: Zod omite las claves opcionales ausentes.
  return Object.fromEntries(keys.map((k) => [k, data[k] === undefined ? null : data[k]])) as never;
}
