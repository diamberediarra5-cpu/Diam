import { describe, expect, it } from "vitest";
import { computeTotals, lineTotalCents } from "@/lib/quote-math";

describe("lineTotalCents", () => {
  it("multiplica cantidad por precio", () => {
    expect(lineTotalCents({ quantity: 8, unitPriceCents: 3500 })).toBe(28000);
  });
  it("redondea al céntimo con decimales en la cantidad", () => {
    // 2,5 m² × 12,33 € = 30,825 → 30,83
    expect(lineTotalCents({ quantity: 2.5, unitPriceCents: 1233 })).toBe(3083);
  });
  it("evita errores de coma flotante", () => {
    // 0.1 * 3 en float es 0.30000000000000004
    expect(lineTotalCents({ quantity: 0.1, unitPriceCents: 300 })).toBe(30);
  });
});

describe("computeTotals", () => {
  it("calcula base, IVA y total", () => {
    const t = computeTotals(
      [
        { quantity: 1, unitPriceCents: 24500 },
        { quantity: 8, unitPriceCents: 3500 },
      ],
      10,
      0,
    );
    expect(t.subtotalCents).toBe(52500);
    expect(t.vatCents).toBe(5250);
    expect(t.irpfCents).toBe(0);
    expect(t.totalCents).toBe(57750);
  });

  it("resta la retención de IRPF", () => {
    const t = computeTotals([{ quantity: 1, unitPriceCents: 100000 }], 21, 15);
    expect(t.vatCents).toBe(21000);
    expect(t.irpfCents).toBe(15000);
    expect(t.totalCents).toBe(106000);
  });

  it("presupuesto vacío = 0", () => {
    expect(computeTotals([], 21, 0).totalCents).toBe(0);
  });
});
