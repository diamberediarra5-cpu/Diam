import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resetDb } from "../setup/db";

const sent: Array<{ to: string; text: string }> = [];
vi.mock("@/services/email", async (orig) => {
  const mod = await orig<typeof import("@/services/email")>();
  return {
    ...mod,
    sendEmail: vi.fn(async (m: { to: string; text: string }) => {
      sent.push(m);
      return true;
    }),
  };
});

const ORIGIN = { origin: "http://localhost:3000" };

async function signUp(email: string, password = "contraseña-segura") {
  return auth.api.signUpEmail({ body: { name: "Ana Pérez", email, password }, headers: new Headers(ORIGIN), asResponse: true });
}

function cookieFrom(res: Response) {
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

describe("autenticación", () => {
  beforeEach(async () => {
    await resetDb();
    sent.length = 0;
  });

  it("registro crea usuario, sesión y suscripción Gratis", async () => {
    const res = await signUp("ana@test.es");
    expect(res.status).toBe(200);
    const user = await db.user.findUniqueOrThrow({ where: { email: "ana@test.es" }, include: { subscription: true, accounts: true } });
    expect(user.subscription?.plan).toBe("FREE");
    // La contraseña nunca se guarda en claro.
    expect(user.accounts[0].password).toBeTruthy();
    expect(user.accounts[0].password).not.toContain("contraseña-segura");
    const events = await db.analyticsEvent.findMany({ where: { userId: user.id } });
    expect(events.map((e) => e.name)).toContain("signup");
  });

  it("no permite registrar dos veces el mismo email", async () => {
    await signUp("dup@test.es");
    const res = await signUp("dup@test.es");
    expect(res.status).toBe(422);
    expect(((await res.json()) as { code: string }).code).toMatch(/USER_ALREADY_EXISTS/);
  });

  it("rechaza contraseñas cortas", async () => {
    const res = await signUp("corta@test.es", "1234567");
    expect(res.status).toBe(400);
  });

  it("login correcto, login incorrecto, sesión y logout", async () => {
    await signUp("login@test.es");
    const bad = await auth.api.signInEmail({ body: { email: "login@test.es", password: "mala-contraseña" }, headers: new Headers(ORIGIN), asResponse: true });
    expect(bad.status).toBe(401);

    const ok = await auth.api.signInEmail({ body: { email: "login@test.es", password: "contraseña-segura" }, headers: new Headers(ORIGIN), asResponse: true });
    expect(ok.status).toBe(200);
    const cookie = cookieFrom(ok);
    expect(cookie).toContain("better-auth.session_token");

    const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(session?.user.email).toBe("login@test.es");

    await auth.api.signOut({ headers: new Headers({ cookie, ...ORIGIN }) });
    expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).toBeNull();
  });

  it("sin cookie no hay sesión", async () => {
    expect(await auth.api.getSession({ headers: new Headers() })).toBeNull();
  });

  it("recuperación de contraseña: email con enlace, cambio y revocación de sesiones", async () => {
    const signup = await signUp("reset@test.es");
    const oldCookie = cookieFrom(signup);

    await auth.api.requestPasswordReset({ body: { email: "reset@test.es", redirectTo: "/restablecer" }, headers: new Headers(ORIGIN) });
    expect(sent).toHaveLength(1);
    const url = sent[0].text.match(/https?:\/\/\S+/)![0];
    const token = new URL(url).pathname.split("/").pop()!;

    await auth.api.resetPassword({ body: { newPassword: "nueva-contraseña-1", token }, headers: new Headers(ORIGIN) });

    // La sesión anterior queda revocada.
    expect(await auth.api.getSession({ headers: new Headers({ cookie: oldCookie }) })).toBeNull();
    const ok = await auth.api.signInEmail({ body: { email: "reset@test.es", password: "nueva-contraseña-1" }, headers: new Headers(ORIGIN), asResponse: true });
    expect(ok.status).toBe(200);

    // El token es de un solo uso.
    await expect(auth.api.resetPassword({ body: { newPassword: "otra-contraseña-2", token }, headers: new Headers(ORIGIN) })).rejects.toThrow();
  });

  it("pedir reset de un email inexistente no revela nada ni envía email", async () => {
    const res = await auth.api.requestPasswordReset({ body: { email: "nadie@test.es", redirectTo: "/restablecer" }, headers: new Headers(ORIGIN) });
    expect(res.status).toBe(true);
    expect(sent).toHaveLength(0);
  });
});
