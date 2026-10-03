/** Traduce errores de Better Auth a mensajes comprensibles. */
export function authErrorMessage(error: { code?: string; status?: number; message?: string } | null | undefined): string {
  if (!error) return "Algo ha fallado. Inténtalo de nuevo.";
  if (error.status === 429) return "Demasiados intentos. Espera un minuto y vuelve a probar.";
  switch (error.code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Ya hay una cuenta con este email. Inicia sesión o recupera tu contraseña.";
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD":
    case "USER_NOT_FOUND":
      return "El email o la contraseña no son correctos.";
    case "PASSWORD_TOO_SHORT":
      return "La contraseña es demasiado corta (mínimo 8 caracteres).";
    case "PASSWORD_TOO_LONG":
      return "La contraseña es demasiado larga.";
    case "INVALID_TOKEN":
      return "El enlace ha caducado o ya se ha usado. Pide uno nuevo.";
    case "INVALID_EMAIL":
      return "El email no es válido.";
    default:
      return "Algo ha fallado. Inténtalo de nuevo.";
  }
}

/** Solo permite redirecciones internas (evita open redirect). */
export function safeNext(next: string | null | undefined, fallback = "/panel"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
