import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/auth-errors";
import { signUpSchema } from "@/validation/auth";
import { clientSchema } from "@/validation/client";
import { businessProfileSchema } from "@/validation/profile";
import { quoteSchema } from "@/validation/quote";

const validQuote = {
  client: { name: "Ana" },
  title: "Pintar salón",
  vatRate: 21,
  irpfRate: 0,
  items: [{ description: "Pintura", quantity: "2", unit: "ud", unitPrice: "10.5" }],
};

describe("quoteSchema", () => {
  it("acepta un presupuesto válido y convierte números", () => {
    const r = quoteSchema.parse(validQuote);
    expect(r.items[0].quantity).toBe(2);
    expect(r.items[0].unitPrice).toBe(10.5);
    expect(r.saveClient).toBe(true);
    expect(r.clientId).toBeNull();
  });
  it("rechaza IVA no permitido", () => {
    expect(quoteSchema.safeParse({ ...validQuote, vatRate: 18 }).success).toBe(false);
  });
  it("exige al menos una partida", () => {
    const r = quoteSchema.safeParse({ ...validQuote, items: [] });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("Añade al menos una partida");
  });
  it("rechaza precios negativos y cantidades 0", () => {
    expect(quoteSchema.safeParse({ ...validQuote, items: [{ description: "x", quantity: 0, unitPrice: 1 }] }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...validQuote, items: [{ description: "x", quantity: 1, unitPrice: -1 }] }).success).toBe(false);
  });
  it("rechaza cantidades no numéricas", () => {
    expect(quoteSchema.safeParse({ ...validQuote, items: [{ description: "x", quantity: Number.NaN, unitPrice: 1 }] }).success).toBe(false);
  });
});

describe("clientSchema", () => {
  it("normaliza NIF y email, y vacía opcionales", () => {
    const r = clientSchema.parse({ name: "  Juan  ", taxId: "12345678-z", email: "JUAN@Mail.com ", phone: "" });
    expect(r).toEqual({ name: "Juan", taxId: "12345678Z", email: "juan@mail.com", phone: undefined, address: undefined });
  });
  it("rechaza email no válido con mensaje en español", () => {
    const r = clientSchema.safeParse({ name: "Juan", email: "no-es-email" });
    expect(r.error?.issues[0].message).toBe("El email no es válido");
  });
});

describe("businessProfileSchema", () => {
  it("valida código postal de 5 cifras", () => {
    expect(businessProfileSchema.safeParse({ businessName: "Reformas", postalCode: "4600" }).success).toBe(false);
    expect(businessProfileSchema.parse({ businessName: "Reformas", postalCode: "46001", defaultVatRate: "10" }).defaultVatRate).toBe(10);
  });
});

describe("signUpSchema", () => {
  it("exige aceptar términos y contraseña de 8+", () => {
    expect(signUpSchema.safeParse({ name: "Ana", email: "a@a.es", password: "1234567", acceptTerms: true }).success).toBe(false);
    expect(signUpSchema.safeParse({ name: "Ana", email: "a@a.es", password: "12345678", acceptTerms: false }).success).toBe(false);
    expect(signUpSchema.safeParse({ name: "Ana", email: "A@A.es", password: "12345678", acceptTerms: true }).data?.email).toBe("a@a.es");
  });
});

describe("safeNext (anti open-redirect)", () => {
  it("solo permite rutas internas", () => {
    expect(safeNext("/panel/clientes")).toBe("/panel/clientes");
    expect(safeNext("https://evil.com")).toBe("/panel");
    expect(safeNext("//evil.com")).toBe("/panel");
    expect(safeNext("/\\evil.com")).toBe("/panel");
    expect(safeNext(undefined)).toBe("/panel");
  });
});
