import { z } from "zod";
import { clientSchema } from "./client";
import { optionalText } from "./common";
import { vatRateSchema } from "./profile";

export const IRPF_RATES = [0, 7, 15, 19] as const;
export const UNITS = ["ud", "h", "m", "m²", "m³", "kg", "l", "día", "servicio"] as const;

export const quoteItemSchema = z.object({
  description: z.string().trim().min(1, "Describe la partida").max(500, "Descripción demasiado larga"),
  quantity: z.coerce
    .number({ error: "Cantidad no válida" })
    .positive("La cantidad debe ser mayor que 0")
    .max(999_999, "Cantidad demasiado grande"),
  unit: z.string().trim().min(1).max(12).default("ud"),
  /** Precio unitario en euros (sin IVA). */
  unitPrice: z.coerce
    .number({ error: "Precio no válido" })
    .min(0, "El precio no puede ser negativo")
    .max(1_000_000, "Precio demasiado alto"),
});

export const quoteSchema = z.object({
  clientId: z.string().trim().max(40).optional().nullable().transform((v) => v || null),
  client: clientSchema,
  saveClient: z.boolean().default(true),
  title: z.string().trim().min(3, "Pon un título al presupuesto").max(140, "Título demasiado largo"),
  validUntil: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Fecha no válida"),
  vatRate: vatRateSchema,
  irpfRate: z.coerce
    .number()
    .int()
    .refine((v) => (IRPF_RATES as readonly number[]).includes(v), "Retención no válida"),
  notes: optionalText(3000, "Las notas"),
  items: z
    .array(quoteItemSchema)
    .min(1, "Añade al menos una partida")
    .max(100, "Máximo 100 partidas por presupuesto"),
});
export type QuoteInput = z.input<typeof quoteSchema>;
export type QuoteData = z.output<typeof quoteSchema>;

export const aiRequestSchema = z.object({
  description: z
    .string()
    .trim()
    .min(15, "Describe el trabajo con un poco más de detalle (mín. 15 caracteres)")
    .max(1500, "La descripción es demasiado larga (máx. 1500 caracteres)"),
});
