import { beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { createClient, deleteClient, getClient, listClients, updateClient } from "@/services/clients";
import { createQuote, getQuote } from "@/services/quotes";
import { createUser, resetDb, sampleQuote } from "../setup/db";

describe("clientes", () => {
  beforeEach(resetDb);

  it("CRUD completo con búsqueda", async () => {
    const u = await createUser();
    const c = await createClient(u.id, { name: "Juan López", email: "JUAN@test.es", phone: "600000000" });
    expect(c.email).toBe("juan@test.es");
    await createClient(u.id, { name: "Ana Ruiz" });
    expect((await listClients(u.id, "juan")).map((x) => x.name)).toEqual(["Juan López"]);
    expect(await listClients(u.id)).toHaveLength(2);

    const updated = await updateClient(u.id, c.id, { name: "Juan López García", phone: "611111111" });
    expect(updated.name).toBe("Juan López García");
    expect(updated.email).toBeNull();

    await deleteClient(u.id, c.id);
    await expect(getClient(u.id, c.id)).rejects.toBeInstanceOf(AppError);
  });

  it("valida los datos", async () => {
    const u = await createUser();
    await expect(createClient(u.id, { name: "J" })).rejects.toThrow();
  });

  it("no se pueden ver, editar ni borrar clientes ajenos", async () => {
    const a = await createUser();
    const b = await createUser();
    const c = await createClient(a.id, { name: "Cliente privado" });
    await expect(getClient(b.id, c.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(updateClient(b.id, c.id, { name: "Hackeado" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(deleteClient(b.id, c.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await getClient(a.id, c.id)).name).toBe("Cliente privado");
    expect(await listClients(b.id)).toHaveLength(0);
  });

  it("borrar un cliente conserva sus presupuestos con la copia de los datos", async () => {
    const u = await createUser();
    const q = await createQuote(u.id, sampleQuote());
    await deleteClient(u.id, q.clientId!);
    const after = await getQuote(u.id, q.id);
    expect(after.clientId).toBeNull();
    expect(after.clientName).toBe("María García");
  });
});
