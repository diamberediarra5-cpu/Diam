# Presupuéstalo

**Presupuestos profesionales en 2 minutos, desde el móvil, para autónomos de oficios en España.**

El autónomo describe el trabajo en una frase → la IA propone las partidas → ajusta precios (IVA e IRPF se calculan solos) → lo envía por WhatsApp → el cliente lo abre en el móvil y lo **acepta con un clic** → el autónomo ve en su panel si se ha visto, aceptado o rechazado.

- Producto: [`docs/product-spec.md`](docs/product-spec.md)
- Arquitectura: [`docs/architecture.md`](docs/architecture.md)
- Base de datos: [`docs/database.md`](docs/database.md)
- Roadmap: [`docs/roadmap.md`](docs/roadmap.md)

| Plan | Precio | Incluye |
|---|---|---|
| Gratis | 0 € | 5 presupuestos nuevos/mes, 3 generaciones IA/mes, enlace de aceptación, marca "Hecho con Presupuéstalo" |
| Pro | 9,90 €/mes (IVA incl.) | Presupuestos ilimitados, 100 generaciones IA/mes, sin marca |

---

## Stack

Next.js 16 (App Router, server actions) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma 7 (`@prisma/adapter-pg`) · Better Auth · Stripe · Resend (HTTP) · Anthropic SDK · Zod 4 · Vitest · Playwright.

## Arquitectura (resumen)

```
src/
  app/            Rutas. (marketing) públicas · (auth) login/registro · (app)/panel privado · p/[token] vista del cliente final
  actions/        Server actions: sesión → validación Zod → servicio → revalidación. Errores siempre "amables".
  services/       Lógica de negocio + acceso a datos. TODAS las consultas filtran por userId (ownership en backend).
    ai/           Capa AiProvider (Anthropic / mock) + generador de partidas
    billing/      Stripe: checkout, portal, webhook verificado e idempotente
  validation/     Esquemas Zod compartidos cliente/servidor
  lib/            env, db, auth, cálculo de totales (céntimos enteros), planes, fechas
  components/     UI (estilo shadcn, sin dependencias) y componentes de dominio
prisma/           schema + migraciones
tests/            unit · integration (Postgres real) · e2e (Playwright)
```

Decisiones clave (detalle en `docs/architecture.md`):
- **Better Auth** en vez de Supabase Auth: usuarios en nuestra propia BD, coste 0, testeable en local. Sesiones en BD con cookie `httpOnly`.
- **Importes en céntimos** y totales **siempre calculados en servidor**; lo que envíe el navegador se ignora.
- **Límite mensual** con contador monotónico (`UsageCounter`) que se consume dentro de la transacción: borrar presupuestos no devuelve cupo y no se puede superar con peticiones concurrentes.
- **Rate limiting en Postgres** (sirve en serverless, sin Redis).
- **PDF** = impresión del navegador con CSS de impresión (sin dependencias ni coste de servidor).

## Desarrollo local

Requisitos: Node ≥ 20.19 (probado con 22), PostgreSQL 14+.

```bash
npm install                     # también genera el cliente Prisma
cp .env.example .env            # rellena DATABASE_URL y BETTER_AUTH_SECRET como mínimo
npx prisma migrate dev          # crea las tablas
npm run dev                     # http://localhost:3000
```

Para probar la IA sin coste ni clave: `AI_PROVIDER=mock` en `.env` (respuestas de ejemplo fijas).
Sin `RESEND_API_KEY`, los emails (recuperar contraseña) se imprimen en la consola del servidor.

### Variables de entorno

Todas documentadas en [`.env.example`](.env.example). Mínimas para arrancar: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL`.
Los secretos solo se leen en servidor (`src/lib/env.ts` es `server-only`). Nada sensible lleva el prefijo `NEXT_PUBLIC_`.

## Base de datos

- Esquema: `prisma/schema.prisma` (ver `docs/database.md`).
- Nueva migración en desarrollo: `npx prisma migrate dev --name descripcion` y después `npx prisma generate`.
- Producción: `npx prisma migrate deploy` (lo hace el script `vercel-build`).
- Explorar datos: `npm run db:studio`.

## Tests y calidad

```bash
npm run lint
npm run typecheck
npm test            # unit + integración contra Postgres (BD presupuestalo_test, se migra sola)
npm run build
npm run test:e2e    # Playwright: build de producción + recorrido completo en escritorio y móvil
```

Los tests de integración usan `TEST_DATABASE_URL` (por defecto `postgresql://app:app@localhost:5432/presupuestalo_test`) y **vacían sus tablas**; nunca apuntes a una BD real. El E2E usa `presupuestalo_e2e` (`E2E_DATABASE_URL`) y `AI_PROVIDER=mock`.

Cobertura: cálculo de totales/IVA/IRPF, validaciones, registro/login/logout/sesión, recuperación de contraseña (token de un solo uso, revocación de sesiones), CRUD de clientes y presupuestos, **aislamiento entre usuarios**, límites de plan (incluida concurrencia), IA (límites, rate limit, errores del proveedor), enlace público (aceptar una vez, caducidad, "visto"), webhooks de Stripe (firma, idempotencia, reintentos, estado real), rate limit y contacto. CI en `.github/workflows/ci.yml`.

## Stripe

1. En el Dashboard (modo **test**): crea el producto **Pro** con un precio **recurrente mensual de 9,90 € EUR** (IVA incluido) → copia el `price_…` a `STRIPE_PRICE_PRO_MONTHLY`.
2. Copia la clave secreta `sk_test_…` a `STRIPE_SECRET_KEY`.
3. Activa el **Customer Portal** (Settings → Billing → Customer portal): permitir cancelar y actualizar método de pago.
4. Webhook → endpoint `https://TU_DOMINIO/api/stripe/webhook` con eventos:
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.paid`, `invoice.payment_failed`. Copia el `whsec_…` a `STRIPE_WEBHOOK_SECRET`.
5. En local: `stripe listen --forward-to localhost:3000/api/stripe/webhook` (usa el `whsec_` que imprime) y paga con la tarjeta `4242 4242 4242 4242`.

Cómo funciona: el backend **nunca confía en el navegador**. El plan Pro solo se activa cuando el webhook (firma verificada) informa de la suscripción, y en cada evento se vuelve a leer la suscripción real desde la API de Stripe. Estados `active`, `trialing` y `past_due` dan acceso Pro.
Sin claves de Stripe, la app funciona y la página de plan muestra un aviso en lugar del botón de pago.

> Fiscalidad: el precio se muestra con IVA incluido. Antes de cobrar, revisa con tu gestor si necesitas Stripe Tax / facturas con IVA desglosado (se puede activar `automatic_tax` en el checkout).

## IA

- Capa independiente: `src/services/ai/provider.ts` (interfaz). Implementaciones: `anthropic.ts` (SDK oficial, salida estructurada validada con Zod) y `mock.ts`. Cambiar de proveedor = implementar la interfaz y añadirlo en `ai/index.ts`.
- Configuración: `ANTHROPIC_API_KEY` (solo servidor). Modelo por defecto `claude-opus-5-5` con esfuerzo `low`; se puede cambiar con `AI_MODEL` (p. ej. `claude-haiku-4-5`, más barato). Con los modelos que lo admiten se activa el *fallback* automático del servidor ante rechazos.
- Control de costes: máx. 4.000 tokens de salida por llamada, descripción limitada a 1.500 caracteres, límite mensual por plan (3 / 100), rate limit de 5 llamadas/minuto por usuario, registro de tokens por llamada en `ai_usage`, los fallos no consumen cupo.
- Errores: mensajes claros ("El asistente está muy ocupado…"), nunca detalles técnicos. Si la IA no está configurada, el editor permite añadir partidas a mano.

## Despliegue (Vercel + Neon)

1. Crea una BD Postgres (Neon free tier, región UE, p. ej. Frankfurt) y copia la cadena de conexión.
2. Importa el repo en Vercel. Build command: `npm run vercel-build` (aplica migraciones y compila).
3. Configura las variables de `.env.example` en Vercel (Production). `NEXT_PUBLIC_APP_URL` y `BETTER_AUTH_URL` = tu dominio `https://…`.
4. Configura el dominio, el webhook de Stripe (paso 4 de arriba) y verifica el dominio de envío en Resend.
5. Comprueba: registro, recuperación de contraseña (llega el email), un pago de prueba y que el plan pasa a Pro.

Notas: el plan Hobby de Vercel no admite uso comercial (usa Pro o alternativa: Railway, Fly.io, VPS con `npm run build && npm start`). El rate limit usa la IP de `x-forwarded-for`, que en Vercel la fija la plataforma; detrás de otro proxy asegúrate de que la cabecera no la controla el cliente.

### Costes recurrentes

| Servicio | Coste estimado (0–100 usuarios) |
|---|---|
| Vercel Pro | ~20 $/mes (Hobby gratis solo para pruebas no comerciales) |
| Neon Postgres | 0 € (free tier) |
| Resend | 0 € hasta 3.000 emails/mes |
| Stripe | 1,5 % + 0,25 € por cobro con tarjeta UE, sin cuota fija |
| IA | Pocos céntimos por generación; acotado por los límites de plan. `AI_MODEL=claude-haiku-4-5` lo reduce más |
| Dominio .es | ~10 €/año |

## Analítica

Tabla propia `analytics_event` (sin terceros ni cookies de seguimiento): `signup`, `login`, `onboarding_completed`, `main_action_started`, `main_action_completed`, `ai_generated`, `quote_shared`, `quote_accepted`, `quote_rejected`, `upgrade_clicked`, `subscription_started`, `subscription_cancelled`. Solo nombre, usuario y contadores; nunca contenido de presupuestos.

## Seguridad

- Autorización en backend en cada servicio (`where: { id, userId }`); probado con tests de acceso cruzado.
- Enlaces públicos con token aleatorio de 192 bits, `noindex`, `Referrer-Policy: no-referrer`.
- CSRF: server actions con comprobación de `Origin` de Next.js; Better Auth con `trustedOrigins`.
- XSS: React escapa todo; el único `dangerouslySetInnerHTML` es JSON-LD estático escapado.
- SQL: solo Prisma parametrizado (la única consulta raw usa plantillas parametrizadas).
- Rate limit: login/registro/reset (Better Auth, en BD), IA, aceptación pública y contacto (+ honeypot).
- Webhooks con firma verificada sobre el cuerpo crudo, idempotentes por `event.id`.
- Cabeceras: CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, `Permissions-Policy`.
- Contraseñas con scrypt (Better Auth); el cambio de contraseña o reset revoca otras sesiones.
- `npm audit`: 4 avisos "high" en dependencias del **CLI** de Prisma 7 (`mysql2`, `deepmerge-ts`), no usadas en runtime con Postgres. La "solución" automática es bajar a Prisma 6; se recomienda actualizar Prisma cuando publique el parche.

## Troubleshooting

| Problema | Solución |
|---|---|
| `Cannot find module '@/generated/prisma/client'` | `npx prisma generate` (Prisma 7 no lo genera al migrar) |
| `Falta la variable de entorno …` | Revisa `.env` frente a `.env.example` |
| Login funciona en local pero no en producción | `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` deben ser exactamente tu dominio `https://…` |
| "Demasiados intentos" | Rate limit de seguridad; espera un minuto |
| El plan no pasa a Pro tras pagar | Revisa en Stripe → Webhooks los intentos fallidos; `STRIPE_WEBHOOK_SECRET` y `STRIPE_PRICE_PRO_MONTHLY` deben coincidir con el entorno |
| No llegan emails | `RESEND_API_KEY` y dominio verificado en Resend; en dev se ven en la consola |
| Botón de IA dice "no disponible" | Falta `ANTHROPIC_API_KEY` (o pon `AI_PROVIDER=mock` en desarrollo) |
| Tests de integración fallan al conectar | Crea la BD `presupuestalo_test` o define `TEST_DATABASE_URL` |
