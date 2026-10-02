import { z } from "zod";
import { optionalEmail, optionalTaxId, optionalText } from "./common";

export const VAT_RATES = [21, 10, 4, 0] as const;

export const vatRateSchema = z.coerce
  .number()
  .int()
  .refine((v) => (VAT_RATES as readonly number[]).includes(v), "Tipo de IVA no válido");

export const businessProfileSchema = z.object({
  businessName: z.string().trim().min(2, "Escribe el nombre de tu negocio").max(120, "Nombre demasiado largo"),
  taxId: optionalTaxId,
  address: optionalText(200, "La dirección"),
  city: optionalText(80, "La ciudad"),
  postalCode: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^\d{5}$/.test(v), "El código postal debe tener 5 cifras"),
  phone: optionalText(30, "El teléfono"),
  email: optionalEmail,
  defaultVatRate: vatRateSchema.default(21),
  defaultNotes: optionalText(2000, "Las condiciones"),
});
export type BusinessProfileInput = z.input<typeof businessProfileSchema>;

export const nameSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(80, "Nombre demasiado largo"),
});
