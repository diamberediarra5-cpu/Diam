import { z } from "zod";
import { optionalEmail, optionalTaxId, optionalText } from "./common";

export const clientSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del cliente").max(120, "Nombre demasiado largo"),
  taxId: optionalTaxId,
  email: optionalEmail,
  phone: optionalText(30, "El teléfono"),
  address: optionalText(200, "La dirección"),
});
export type ClientInput = z.input<typeof clientSchema>;
export type ClientData = z.output<typeof clientSchema>;
