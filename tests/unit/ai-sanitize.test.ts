import { describe, expect, it } from "vitest";
import { sanitizeGenerated } from "@/services/ai/quote-generator";

describe("sanitizeGenerated", () => {
  it("normaliza unidades, cantidades y precios inválidos", () => {
    const r = sanitizeGenerated({
      title: "  Reforma  ",
      items: [
        { description: "Plato de ducha", quantity: 1, unit: "ud", unitPrice: 245.456 },
        { description: "Horas", quantity: -3, unit: "horas", unitPrice: -10 },
        { description: "   ", quantity: 1, unit: "ud", unitPrice: 1 },
      ],
    });
    expect(r.title).toBe("Reforma");
    expect(r.items).toHaveLength(2);
    expect(r.items[0]).toEqual({ description: "Plato de ducha", quantity: 1, unit: "ud", unitPrice: 245.46 });
    expect(r.items[1]).toEqual({ description: "Horas", quantity: 1, unit: "ud", unitPrice: 0 });
  });
  it("limita a 15 partidas", () => {
    const items = Array.from({ length: 30 }, (_, i) => ({ description: `P${i}`, quantity: 1, unit: "ud", unitPrice: 1 }));
    expect(sanitizeGenerated({ title: "x", items }).items).toHaveLength(15);
  });
});
