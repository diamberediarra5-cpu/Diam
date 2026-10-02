import { expect, test, type Page } from "@playwright/test";

/**
 * Simula un usuario real de principio a fin (test manual automatizado):
 * landing → registro → onboarding → presupuesto con IA → guardar → editar → cliente acepta →
 * duplicar/eliminar → clientes → ajustes → suscripción → logout → login.
 */

const email = `e2e_${Date.now()}@test.es`;
const password = "Contraseña-E2E-1";
const shots = (page: Page, name: string) => page.screenshot({ path: `test-results/shots/desktop-${name}.png`, fullPage: true });

test.describe.configure({ mode: "serial" });

test("recorrido completo de un autónomo", async ({ page, browser }) => {
  // 1. Landing
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Deja de hacer presupuestos");
  await shots(page, "01-landing");
  await page.getByRole("link", { name: "Hacer mi primer presupuesto gratis" }).click();

  // 2. Registro (primero con errores de validación)
  await expect(page).toHaveURL(/\/registro/);
  await page.getByRole("button", { name: "Crear cuenta gratis" }).click();
  await expect(page.getByText("Escribe tu nombre")).toBeVisible();
  await expect(page.getByText("Debes aceptar los términos")).toBeVisible();
  await page.getByLabel("Tu nombre").fill("Pepe Fontanero");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crear cuenta gratis" }).click();

  // 3. Onboarding
  await expect(page).toHaveURL(/\/bienvenida/);
  await shots(page, "02-onboarding");
  await page.getByLabel("Nombre del negocio o tu nombre comercial").fill("Fontanería Pepe");
  await page.getByLabel("NIF / CIF").fill("12345678Z");
  await page.getByLabel("IVA que aplicas normalmente").selectOption("10");
  await page.getByRole("button", { name: "Empezar a hacer presupuestos" }).click();

  // 4. Funcionalidad principal: nuevo presupuesto con IA
  await expect(page).toHaveURL(/\/panel\/presupuestos\/nuevo/);
  await expect(page.getByLabel("IVA", { exact: true })).toHaveValue("10");
  // Guardar vacío muestra errores comprensibles
  await page.getByRole("button", { name: "Guardar presupuesto" }).click();
  await expect(page.getByText("Revisa los campos marcados en rojo.")).toBeVisible();

  await page.getByLabel("Nombre del cliente").fill("María García");
  await page.getByLabel("Teléfono", { exact: true }).fill("600 111 222");
  await page.getByLabel("Descripción del trabajo").fill("Cambiar bañera por plato de ducha de 120x80 con mampara y grifo nuevo");
  await page.getByRole("button", { name: /Generar partidas con IA/ }).click();
  await expect(page.getByText("Partidas añadidas abajo")).toBeVisible();
  await expect(page.getByLabel("Título del presupuesto")).not.toHaveValue("");
  await expect(page.getByText("Te quedan 2 generaciones este mes.")).toBeVisible();
  // La partida de material viene a 0: el autónomo pone su precio
  await page.getByLabel("Precio (€, sin IVA)").nth(1).fill("245,50");
  await expect(page.getByText(/^Total\s+842,05\s€$/)).toBeVisible();
  await shots(page, "03-editor");
  await page.getByRole("button", { name: "Guardar presupuesto" }).click();

  // 5. Detalle guardado
  await expect(page).toHaveURL(/\/panel\/presupuestos\/[^/]+\?nuevo=1/);
  await expect(page.getByText("¡Presupuesto guardado!")).toBeVisible();
  await expect(page.locator("article").getByText("Fontanería Pepe")).toBeVisible();
  await expect(page.locator("article").getByText("NIF: 12345678Z")).toBeVisible();
  await shots(page, "04-detalle");
  const quoteUrl = page.url().split("?")[0];
  const publicHref = await page.getByRole("link", { name: "Ver como cliente" }).getAttribute("href");
  expect(publicHref).toMatch(/^\/p\/[A-Za-z0-9_-]{20,}$/);
  const wa = await page.getByRole("link", { name: "Enviar por WhatsApp" }).getAttribute("href");
  expect(wa).toContain("https://wa.me/34600111222?text=");

  // 6. Editar
  await page.getByRole("link", { name: "Editar" }).click();
  await expect(page).toHaveURL(/\/editar$/);
  await page.getByLabel("Título del presupuesto").fill("Reforma de baño completa");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page).toHaveURL(quoteUrl);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reforma de baño completa");

  // 7. El cliente final abre el enlace (sin sesión) y acepta
  const clientCtx = await browser.newContext();
  const clientPage = await clientCtx.newPage();
  await clientPage.goto(publicHref!);
  await expect(clientPage.getByText("Reforma de baño completa")).toBeVisible();
  await expect(clientPage.getByText("Presupuesto hecho con")).toBeVisible();
  await clientPage.screenshot({ path: "test-results/shots/desktop-05-publico.png", fullPage: true });
  await clientPage.getByRole("button", { name: "Aceptar presupuesto" }).click();
  await expect(clientPage.getByText(/Presupuesto aceptado el/)).toBeVisible();
  await clientCtx.close();

  await page.reload();
  await expect(page.getByText("Aceptado", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Editar" })).toHaveCount(0);

  // 8. Duplicar y eliminar la copia
  await page.getByRole("button", { name: "Duplicar" }).click();
  await expect(page).toHaveURL(/\/editar$/);
  await expect(page.getByLabel("Título del presupuesto")).toHaveValue("Reforma de baño completa (copia)");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page).toHaveURL(/\/panel\/presupuestos\/[^/]+$/);
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Sí, eliminar" }).click();
  await expect(page).toHaveURL(/\/panel\/presupuestos\?eliminado=1/);
  await expect(page.getByText("(copia)")).toHaveCount(0);
  await expect(page.getByText("Reforma de baño completa")).toBeVisible();

  // 9. Clientes: se guardó solo
  await page.getByRole("link", { name: "Clientes" }).first().click();
  await expect(page.getByText("María García")).toBeVisible();
  await expect(page.getByText("1 presupuesto")).toBeVisible();

  // 10. Ajustes
  await page.getByRole("link", { name: "Ajustes" }).first().click();
  await page.getByLabel("Teléfono").fill("611 222 333");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Cambios guardados.")).toBeVisible();

  // 11. Suscripción
  await page.getByRole("link", { name: "Plan" }).first().click();
  await expect(page.getByText("Tu plan:")).toBeVisible();
  await expect(page.getByText("Gratis", { exact: true })).toBeVisible();
  await expect(page.getByText("2 / 5")).toBeVisible(); // 1 creado + 1 duplicado (eliminado) cuentan
  await shots(page, "06-suscripcion");

  // 12. Dashboard con datos
  await page.getByRole("link", { name: "Inicio" }).first().click();
  await expect(page.getByText("Reforma de baño completa")).toBeVisible();
  await shots(page, "07-dashboard");

  // 13. Logout y vuelta a entrar
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/entrar/);
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/entrar\?next=%2Fpanel/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill("incorrecta-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("El email o la contraseña no son correctos.")).toBeVisible();
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/panel$/);
  await expect(page.getByRole("heading", { name: "Hola, Pepe" })).toBeVisible();
});

test("las rutas privadas y los presupuestos ajenos están protegidos", async ({ page, request }) => {
  await page.goto("/panel/presupuestos/nuevo");
  await expect(page).toHaveURL(/\/entrar/);
  const res = await request.get("/p/token-que-no-existe-0123456789");
  expect(res.status()).toBe(404);
});

test("SEO: robots, sitemap y metadatos", async ({ page, request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /panel");
  expect(robots).toContain("Sitemap:");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/precios");
  await page.goto("/precios");
  await expect(page).toHaveTitle(/Precios · Presupuéstalo/);
  expect(await page.locator('meta[name="description"]').getAttribute("content")).toContain("9,90");
  expect(await page.locator('meta[property="og:title"]').count()).toBe(1);
  expect(await page.locator("h1").count()).toBe(1);
});
