const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function formatCents(cents: number): string {
  return eur.format(cents / 100);
}

/** Convierte euros (número o texto "12,50") a céntimos enteros. */
export function eurosToCents(value: number | string): number {
  const n = typeof value === "string" ? Number(value.replace(/\./g, "").replace(",", ".")) : value;
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

export function centsToEuros(cents: number): number {
  return cents / 100;
}

const qty = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
export function formatQuantity(q: number): string {
  return qty.format(q);
}
