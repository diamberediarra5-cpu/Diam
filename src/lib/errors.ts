/**
 * Error de negocio con un mensaje apto para mostrar al usuario.
 * Cualquier otro error se considera inesperado y se muestra un mensaje genérico.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "VALIDATION"
      | "LIMIT_REACHED"
      | "RATE_LIMITED"
      | "UNAVAILABLE"
      | "CONFLICT" = "VALIDATION",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const GENERIC_ERROR = "Algo ha fallado. Inténtalo de nuevo en unos segundos.";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function userMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  return GENERIC_ERROR;
}

/** Registra errores inesperados sin volcar datos del usuario. */
export function logError(context: string, error: unknown) {
  if (error instanceof AppError) return;
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error(`[${context}] ${message}`);
}
