import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getProfile, saveProfile } from "@/services/profile";
import { createUser, resetDb } from "../setup/db";

describe("perfil del negocio / onboarding", () => {
  beforeEach(resetDb);

  it("el onboarding crea el perfil, marca onboardedAt y registra el evento una sola vez", async () => {
    const u = await createUser({ onboard: false });
    await saveProfile(u.id, { businessName: "Fontanería Pepe", taxId: "12345678z", defaultVatRate: 10 });
    const p = await getProfile(u.id);
    expect(p?.onboardedAt).not.toBeNull();
    expect(p?.taxId).toBe("12345678Z");
    expect(p?.defaultVatRate).toBe(10);
    await saveProfile(u.id, { businessName: "Fontanería Pepe SL" });
    expect(await db.analyticsEvent.count({ where: { userId: u.id, name: "onboarding_completed" } })).toBe(1);
  });

  it("vaciar un campo opcional lo borra", async () => {
    const u = await createUser({ onboard: false });
    await saveProfile(u.id, { businessName: "Taller", taxId: "B12345678", phone: "600000000" });
    await saveProfile(u.id, { businessName: "Taller", taxId: "", phone: "600000000" });
    const p = await getProfile(u.id);
    expect(p?.taxId).toBeNull();
    expect(p?.phone).toBe("600000000");
  });

  it("rechaza datos inválidos", async () => {
    const u = await createUser({ onboard: false });
    await expect(saveProfile(u.id, { businessName: "X" })).rejects.toThrow();
    await expect(saveProfile(u.id, { businessName: "Taller", defaultVatRate: 18 })).rejects.toThrow();
  });
});
