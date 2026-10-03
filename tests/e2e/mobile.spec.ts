import { expect, test, type Page } from "@playwright/test";

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test("móvil: landing, registro, onboarding y editor sin scroll horizontal", async ({ page }) => {
  for (const path of ["/", "/precios", "/contacto", "/registro", "/entrar", "/terminos"]) {
    await page.goto(path);
    await noHorizontalScroll(page);
  }
  await page.goto("/");
  await page.screenshot({ path: "test-results/shots/mobile-01-landing.png", fullPage: true });

  await page.goto("/registro");
  await page.getByLabel("Tu nombre").fill("Lucía Electricista");
  await page.getByLabel("Email").fill(`mobile_${Date.now()}@test.es`);
  await page.getByLabel("Contraseña").fill("Contraseña-Movil-1");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crear cuenta gratis" }).click();
  await expect(page).toHaveURL(/\/bienvenida/);
  await page.getByLabel("Nombre del negocio o tu nombre comercial").fill("Electricidad Lucía");
  await page.getByRole("button", { name: "Empezar a hacer presupuestos" }).click();
  await expect(page).toHaveURL(/\/panel\/presupuestos\/nuevo/);
  await noHorizontalScroll(page);
  // Navegación inferior visible en móvil
  await expect(page.getByRole("navigation", { name: "Principal" }).last()).toBeVisible();
  await page.getByLabel("Nombre del cliente").fill("Comunidad de vecinos");
  await page.getByLabel("Descripción de la partida 1").fill("Revisión de cuadro eléctrico");
  await page.getByLabel("Precio (€, sin IVA)").fill("90");
  await page.getByLabel("Título del presupuesto").fill("Revisión eléctrica");
  await page.screenshot({ path: "test-results/shots/mobile-02-editor.png", fullPage: true });
  await page.getByRole("button", { name: "Guardar presupuesto" }).click();
  await expect(page.getByText("¡Presupuesto guardado!")).toBeVisible();
  await noHorizontalScroll(page);
  await page.screenshot({ path: "test-results/shots/mobile-03-detalle.png", fullPage: true });

  await page.goto("/panel");
  await noHorizontalScroll(page);
  await page.screenshot({ path: "test-results/shots/mobile-04-dashboard.png", fullPage: true });
});
