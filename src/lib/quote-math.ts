export type LineInput = { quantity: number; unitPriceCents: number };

export type QuoteTotals = {
  lines: number[];
  subtotalCents: number;
  vatCents: number;
  irpfCents: number;
  totalCents: number;
};

/** Importe de una línea: cantidad (2 decimales) × precio, redondeado al céntimo. */
export function lineTotalCents({ quantity, unitPriceCents }: LineInput): number {
  const hundredths = Math.round(quantity * 100);
  return Math.round((hundredths * unitPriceCents) / 100);
}

/**
 * Totales de un presupuesto. Siempre se calculan en servidor al guardar.
 * total = base + IVA − retención IRPF.
 */
export function computeTotals(lines: LineInput[], vatRate: number, irpfRate: number): QuoteTotals {
  const lineTotals = lines.map(lineTotalCents);
  const subtotalCents = lineTotals.reduce((a, b) => a + b, 0);
  const vatCents = Math.round((subtotalCents * vatRate) / 100);
  const irpfCents = Math.round((subtotalCents * irpfRate) / 100);
  return {
    lines: lineTotals,
    subtotalCents,
    vatCents,
    irpfCents,
    totalCents: subtotalCents + vatCents - irpfCents,
  };
}
