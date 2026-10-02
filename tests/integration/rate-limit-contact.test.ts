import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { submitContact } from "@/services/contact";
import { rateLimit } from "@/services/rate-limit";
import { resetDb } from "../setup/db";

describe("rate limit en BD", () => {
  beforeEach(resetDb);

  it("permite hasta el máximo en la ventana y reinicia al caducar", async () => {
    for (let i = 0; i < 3; i++) expect((await rateLimit("t1", 3, 60_000)).ok).toBe(true);
    expect((await rateLimit("t1", 3, 60_000)).ok).toBe(false);
    // Otra clave es independiente.
    expect((await rateLimit("t2", 3, 60_000)).ok).toBe(true);
    // Ventana de 1 ms: tras esperar, se reinicia.
    await rateLimit("t3", 1, 1);
    await new Promise((r) => setTimeout(r, 5));
    expect((await rateLimit("t3", 1, 1)).ok).toBe(true);
  });

  it("es atómico con peticiones concurrentes", async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => rateLimit("conc", 5, 60_000)));
    expect(results.filter((r) => r.ok)).toHaveLength(5);
  });
});

describe("formulario de contacto", () => {
  beforeEach(resetDb);

  it("guarda el mensaje y limita el spam por IP", async () => {
    const msg = { name: "Pepe", email: "pepe@test.es", message: "Hola, tengo una duda sobre el plan Pro." };
    for (let i = 0; i < 3; i++) await submitContact(msg, "1.2.3.4");
    await expect(submitContact(msg, "1.2.3.4")).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(await db.contactMessage.count()).toBe(3);
  });

  it("rechaza bots que rellenan el honeypot", async () => {
    await expect(submitContact({ name: "Bot", email: "bot@x.es", message: "spam spam spam", website: "http://x" }, "5.5.5.5")).rejects.toThrow();
    expect(await db.contactMessage.count()).toBe(0);
  });
});
