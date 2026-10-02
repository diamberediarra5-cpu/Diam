import { z } from "zod";

export const PASSWORD_MIN = 8;

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(80),
  email: z.email("El email no es válido").trim().toLowerCase(),
  password: z
    .string()
    .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`)
    .max(128, "La contraseña es demasiado larga"),
  acceptTerms: z.literal(true, { error: "Debes aceptar los términos y la política de privacidad" }),
});

export const signInSchema = z.object({
  email: z.email("El email no es válido").trim().toLowerCase(),
  password: z.string().min(1, "Escribe tu contraseña"),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(80),
  email: z.email("El email no es válido").trim().toLowerCase(),
  message: z.string().trim().min(10, "Cuéntanos un poco más (mín. 10 caracteres)").max(3000),
  // Honeypot anti-spam: debe venir vacío.
  website: z.string().max(0).optional(),
});
