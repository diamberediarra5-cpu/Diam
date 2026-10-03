/** Inicio del mes natural actual (UTC). Los límites mensuales se cuentan desde aquí. */
export function startOfMonthUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

const dateFmt = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Madrid" });
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return dateFmt.format(new Date(d));
}

/** "YYYY-MM-DD" para inputs type=date. */
export function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

/** Un presupuesto vence al final del día de validez. */
export function isExpired(validUntil: Date | null | undefined, now = new Date()): boolean {
  if (!validUntil) return false;
  const end = new Date(validUntil);
  end.setUTCHours(23, 59, 59, 999);
  return now > end;
}
