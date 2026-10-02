import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { setAiProviderForTests } from "@/services/ai";
import { MockProvider } from "@/services/ai/mock";
import { AiProviderError, type AiProvider } from "@/services/ai/provider";
import { generateQuoteItems } from "@/services/ai/quote-generator";
import { createUser, resetDb } from "../setup/db";

const DESC = { description: "Cambiar bañera por plato de ducha de 120x80 con mampara" };

class FailingProvider implements AiProvider {
  name = "failing";
  model = "failing-model";
  constructor(private error: Error) {}
  async generateJson(): Promise<never> {
    throw this.error;
  }
}

describe("IA: generación de partidas", () => {
  beforeEach(resetDb);
  afterEach(() => setAiProviderForTests(undefined));

  it("sin proveedor configurado → mensaje claro, sin registrar uso", async () => {
    setAiProviderForTests(null);
    const u = await createUser();
    await expect(generateQuoteItems(u.id, DESC)).rejects.toMatchObject({ code: "UNAVAILABLE" });
    expect(await db.aiUsage.count()).toBe(0);
  });

  it("genera partidas válidas y registra el uso", async () => {
    setAiProviderForTests(new MockProvider());
    const u = await createUser();
    const r = await generateQuoteItems(u.id, DESC);
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.items.every((i) => i.quantity > 0 && i.unitPrice >= 0)).toBe(true);
    expect(await db.aiUsage.count({ where: { userId: u.id, success: true } })).toBe(1);
  });

  it("valida la descripción (no llama a la IA con textos vacíos)", async () => {
    setAiProviderForTests(new MockProvider());
    const u = await createUser();
    await expect(generateQuoteItems(u.id, { description: "corto" })).rejects.toThrow();
    expect(await db.aiUsage.count()).toBe(0);
  });

  it("plan Gratis: 3 generaciones al mes", async () => {
    setAiProviderForTests(new MockProvider());
    const u = await createUser();
    for (let i = 0; i < 3; i++) await generateQuoteItems(u.id, DESC);
    await expect(generateQuoteItems(u.id, DESC)).rejects.toMatchObject({ code: "LIMIT_REACHED" });
  });

  it("rate limit: máximo 5 por minuto aunque el plan lo permita", async () => {
    setAiProviderForTests(new MockProvider());
    const u = await createUser({ plan: "PRO" });
    for (let i = 0; i < 5; i++) await generateQuoteItems(u.id, DESC);
    await expect(generateQuoteItems(u.id, DESC)).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("errores del proveedor → mensaje para el usuario, sin detalles técnicos, y no consumen cuota", async () => {
    setAiProviderForTests(new FailingProvider(new AiProviderError("El asistente está muy ocupado ahora mismo. Prueba en un minuto.", true)));
    const u = await createUser();
    await expect(generateQuoteItems(u.id, DESC)).rejects.toMatchObject({ code: "UNAVAILABLE", message: expect.stringContaining("ocupado") });

    setAiProviderForTests(new FailingProvider(new TypeError("Cannot read properties of undefined (reading 'x')")));
    const err = await generateQuoteItems(u.id, DESC).catch((e) => e);
    expect(err.message).not.toContain("undefined");
    expect(await db.aiUsage.count({ where: { success: false } })).toBe(2);
    expect(await db.aiUsage.count({ where: { success: true } })).toBe(0);
  });
});
