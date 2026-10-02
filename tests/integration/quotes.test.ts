import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  createQuote,
  dashboardStats,
  deleteQuote,
  duplicateQuote,
  getPublicQuote,
  getQuote,
  listQuotes,
  markShared,
  markViewed,
  respondToQuote,
  setQuoteStatus,
  updateQuote,
} from "@/services/quotes";
import { createUser, resetDb, sampleQuote } from "../setup/db";

async function expectAppError(p: Promise<unknown>, code: AppError["code"]) {
  const err = await p.then(() => null, (e) => e);
  expect(err).toBeInstanceOf(AppError);
  expect((err as AppError).code).toBe(code);
  return err as AppError;
}

describe("presupuestos", () => {
  beforeEach(resetDb);

  it("crea un presupuesto con totales calculados en servidor, numeración y cliente guardado", async () => {
    const u = await createUser();
    const q = await createQuote(u.id, sampleQuote());
    expect(q.number).toBe(`${new Date().getUTCFullYear()}-0001`);
    expect(q.subtotalCents).toBe(52500);
    expect(q.vatCents).toBe(5250);
    expect(q.totalCents).toBe(57750);
    expect(q.status).toBe("DRAFT");
    expect(q.publicToken.length).toBeGreaterThanOrEqual(30);
    expect(q.clientId).toBeTruthy();

    const full = await getQuote(u.id, q.id);
    expect(full.items.map((i) => i.totalCents)).toEqual([24500, 28000]);
    expect(full.items[1].quantity).toBe(8);

    const second = await createQuote(u.id, sampleQuote({ saveClient: false }));
    expect(second.number).toBe(`${new Date().getUTCFullYear()}-0002`);
    expect(second.clientId).toBeNull();
    expect(await db.client.count({ where: { userId: u.id } })).toBe(1);
  });

  it("ignora totales enviados por el cliente (no se puede manipular el importe)", async () => {
    const u = await createUser();
    const q = await createQuote(u.id, { ...sampleQuote(), totalCents: 1 } as never);
    expect(q.totalCents).toBe(57750);
  });

  it("exige completar el perfil antes de crear presupuestos", async () => {
    const u = await createUser({ onboard: false });
    await expectAppError(createQuote(u.id, sampleQuote()), "CONFLICT");
  });

  it("edita un presupuesto y reemplaza sus partidas", async () => {
    const u = await createUser();
    const q = await createQuote(u.id, sampleQuote());
    await updateQuote(u.id, q.id, sampleQuote({ title: "Baño completo", items: [{ description: "Todo", quantity: 1, unit: "servicio", unitPrice: 1000 }], vatRate: 21 }));
    const after = await getQuote(u.id, q.id);
    expect(after.title).toBe("Baño completo");
    expect(after.items).toHaveLength(1);
    expect(after.totalCents).toBe(121000);
    expect(after.number).toBe(q.number);
  });

  it("no permite editar un presupuesto aceptado", async () => {
    const u = await createUser();
    const q = await createQuote(u.id, sampleQuote());
    await setQuoteStatus(u.id, q.id, "ACCEPTED");
    await expectAppError(updateQuote(u.id, q.id, sampleQuote()), "CONFLICT");
  });

  it("elimina un presupuesto y deja registro de auditoría", async () => {
    const u = await createUser();
    const q = await createQuote(u.id, sampleQuote());
    await deleteQuote(u.id, q.id);
    expect(await db.quote.count()).toBe(0);
    expect(await db.quoteItem.count()).toBe(0);
    expect(await db.auditLog.count({ where: { action: "quote.deleted", entityId: q.id } })).toBe(1);
  });

  it("duplica como borrador con nuevo número y nuevo enlace", async () => {
    const u = await createUser();
    const q = await createQuote(u.id, sampleQuote());
    await setQuoteStatus(u.id, q.id, "ACCEPTED");
    const copy = await duplicateQuote(u.id, q.id);
    expect(copy.status).toBe("DRAFT");
    expect(copy.number).not.toBe(q.number);
    expect(copy.publicToken).not.toBe(q.publicToken);
    expect((await getQuote(u.id, copy.id)).items).toHaveLength(2);
  });

  describe("aislamiento entre usuarios (ownership)", () => {
    it("un usuario no puede leer, editar, borrar, duplicar ni cambiar el estado de presupuestos ajenos", async () => {
      const a = await createUser();
      const b = await createUser();
      const q = await createQuote(a.id, sampleQuote());

      await expectAppError(getQuote(b.id, q.id), "NOT_FOUND");
      await expectAppError(updateQuote(b.id, q.id, sampleQuote({ title: "Hackeado" })), "NOT_FOUND");
      await expectAppError(deleteQuote(b.id, q.id), "NOT_FOUND");
      await expectAppError(duplicateQuote(b.id, q.id), "NOT_FOUND");
      await expectAppError(setQuoteStatus(b.id, q.id, "ACCEPTED"), "NOT_FOUND");
      await expectAppError(markShared(b.id, q.id), "NOT_FOUND");

      expect(await listQuotes(b.id)).toHaveLength(0);
      const intact = await getQuote(a.id, q.id);
      expect(intact.title).toBe("Reforma de baño");
      expect(intact.status).toBe("DRAFT");
    });

    it("no se puede asociar un cliente de otro usuario", async () => {
      const a = await createUser();
      const b = await createUser();
      const foreign = await db.client.create({ data: { userId: a.id, name: "Cliente de A" } });
      await expectAppError(createQuote(b.id, sampleQuote({ clientId: foreign.id })), "NOT_FOUND");
    });

    it("las estadísticas solo cuentan los presupuestos propios", async () => {
      const a = await createUser();
      const b = await createUser();
      await createQuote(a.id, sampleQuote());
      const stats = await dashboardStats(b.id);
      expect(stats.monthCount).toBe(0);
      expect(stats.recent).toHaveLength(0);
    });
  });

  describe("límites del plan", () => {
    it("Gratis: máximo 5 presupuestos al mes (incluye duplicados)", async () => {
      const u = await createUser();
      const first = await createQuote(u.id, sampleQuote());
      for (let i = 0; i < 4; i++) await createQuote(u.id, sampleQuote());
      const err = await expectAppError(createQuote(u.id, sampleQuote()), "LIMIT_REACHED");
      expect(err.message).toContain("Pro");
      await expectAppError(duplicateQuote(u.id, first.id), "LIMIT_REACHED");
      // Editar sí se permite.
      await updateQuote(u.id, first.id, sampleQuote({ title: "Editado" }));
    });

    it("Pro activo: sin límite", async () => {
      const u = await createUser({ plan: "PRO" });
      for (let i = 0; i < 7; i++) await createQuote(u.id, sampleQuote());
      expect(await db.quote.count({ where: { userId: u.id } })).toBe(7);
    });

    it("Pro con suscripción cancelada vuelve a tener límites", async () => {
      const u = await createUser({ plan: "PRO" });
      await db.subscription.update({ where: { userId: u.id }, data: { status: "canceled" } });
      for (let i = 0; i < 5; i++) await createQuote(u.id, sampleQuote());
      await expectAppError(createQuote(u.id, sampleQuote()), "LIMIT_REACHED");
    });
  });

  describe("enlace público", () => {
    it("token inválido o inexistente → null", async () => {
      expect(await getPublicQuote("corto")).toBeNull();
      expect(await getPublicQuote("x".repeat(32))).toBeNull();
    });

    it("el cliente ve el presupuesto con la marca en plan Gratis y sin ella en Pro", async () => {
      const free = await createUser();
      const pro = await createUser({ plan: "PRO" });
      const q1 = await createQuote(free.id, sampleQuote());
      const q2 = await createQuote(pro.id, sampleQuote());
      expect((await getPublicQuote(q1.publicToken))?.showBranding).toBe(true);
      expect((await getPublicQuote(q2.publicToken))?.showBranding).toBe(false);
    });

    it("marca 'visto' solo si no lo abre el propietario", async () => {
      const u = await createUser();
      const q = await createQuote(u.id, sampleQuote());
      await markViewed(q.publicToken, u.id);
      expect((await getQuote(u.id, q.id)).viewedAt).toBeNull();
      await markViewed(q.publicToken, null);
      expect((await getQuote(u.id, q.id)).viewedAt).not.toBeNull();
    });

    it("el cliente acepta una sola vez", async () => {
      const u = await createUser();
      const q = await createQuote(u.id, sampleQuote());
      await markShared(u.id, q.id);
      expect((await getQuote(u.id, q.id)).status).toBe("SENT");
      await respondToQuote(q.publicToken, "ACCEPTED");
      const after = await getQuote(u.id, q.id);
      expect(after.status).toBe("ACCEPTED");
      expect(after.respondedAt).not.toBeNull();
      await expectAppError(respondToQuote(q.publicToken, "REJECTED"), "CONFLICT");
      expect((await getQuote(u.id, q.id)).status).toBe("ACCEPTED");
    });

    it("no se puede aceptar un presupuesto caducado", async () => {
      const u = await createUser();
      const q = await createQuote(u.id, sampleQuote({ validUntil: "2020-01-01" }));
      await expectAppError(respondToQuote(q.publicToken, "ACCEPTED"), "CONFLICT");
    });
  });
});
