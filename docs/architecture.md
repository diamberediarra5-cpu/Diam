# Arquitectura

## Stack (versiones estables verificadas en npm, oct-2026)

| Capa | Elección | Motivo |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript | SSR/SEO + server actions, un solo despliegue |
| UI | Tailwind CSS 4 + componentes propios estilo shadcn/ui | Sin dependencias pesadas; copiamos solo lo que usamos |
| BD | PostgreSQL | Free tier en Neon/Supabase/Railway |
| ORM | Prisma 7 (`@prisma/adapter-pg`) | Tipado, migraciones |
| Auth | **Better Auth** (self-hosted, en nuestra BD) | Ver decisión abajo |
| Pagos | Stripe Checkout + Customer Portal + webhooks | Mínimo código, PCI fuera de nuestro servidor |
| Email | Resend vía `fetch` (sin SDK) | Free tier 3.000/mes; sin dependencia |
| IA | Capa `AiProvider`; implementación Anthropic vía `fetch` | Intercambiable, clave solo en servidor |
| Validación | Zod 4 | Compartida cliente/servidor |
| Tests | Vitest (unit + integración con Postgres real) + Playwright (E2E) | |
| Hosting | Vercel (Hobby/Pro) | Next.js nativo |

### Decisión: Better Auth en lugar de Supabase Auth
- Los usuarios viven en **nuestra** BD Postgres: un solo servicio, ownership con claves foráneas reales.
- Coste 0 y sin vendor lock-in; testeable en local sin servicios externos.
- Hash de contraseñas (scrypt), sesiones en BD con cookie `httpOnly`/`secure`/`sameSite=lax`,
  protección CSRF por comprobación de `Origin`, rate limiting integrado.
- Si se prefiere Supabase Auth, solo cambia `src/lib/auth*.ts`; los servicios reciben `userId`.

## Estructura

```
prisma/               schema.prisma + migraciones
src/
  app/
    (marketing)/      landing, precios, contacto, legal  (públicas, SSG)
    (auth)/           login, registro, recuperar contraseña
    (app)/            área privada: dashboard, presupuestos, clientes, ajustes, suscripción
    p/[token]/        vista pública del presupuesto para el cliente final
    api/auth/[...all] handler Better Auth
    api/stripe/webhook webhook verificado
    sitemap.ts, robots.ts
  components/
    ui/               botones, inputs, cards… (estilo shadcn)
    ...               componentes de dominio
  lib/                config, env, db, auth, utilidades puras (money, quote-math)
  services/           lógica de negocio + acceso a datos (siempre filtra por userId)
    ai/               AiProvider + implementación Anthropic + generador de partidas
    billing/          Stripe
  validation/         esquemas Zod
  actions/            server actions (capa fina: sesión → validar → servicio → revalidar)
tests/
  unit/  integration/  e2e/
```

### Reglas de capas
1. **UI** nunca accede a Prisma. Llama a server actions.
2. **Server actions** obtienen `userId` de la sesión (nunca del cliente), validan con Zod y llaman a servicios.
3. **Servicios** reciben `userId` explícito y **todas** las consultas incluyen `where: { userId }`
   (ownership en backend). Lanzan `AppError` con mensajes aptos para el usuario.
4. Errores inesperados se registran en servidor (sin datos sensibles) y se muestra un mensaje genérico.
5. Secretos solo en `process.env` leídos desde `src/lib/env.ts` (módulo `server-only`).

## Seguridad (resumen; detalle en README)
- Ownership en cada consulta; IDs cuid; enlaces públicos con token aleatorio de 32 bytes.
- Server actions: Next.js valida `Origin`; Better Auth valida `trustedOrigins`.
- XSS: React escapa por defecto; no se usa `dangerouslySetInnerHTML` con datos de usuario (solo JSON-LD estático).
- SQL injection: solo Prisma con consultas parametrizadas.
- Rate limiting en BD (funciona en serverless) para IA, aceptación pública y contacto; Better Auth para login.
- Webhooks Stripe verificados con `constructEvent` y body crudo; idempotencia por `event.id`.
- Cabeceras: CSP básica, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Vista pública con `noindex` y `Referrer-Policy: no-referrer`.

## Costes recurrentes estimados (0–100 usuarios)
| Servicio | Coste |
|---|---|
| Vercel Hobby (pruebas) / Pro (comercial) | 0 € / ~20 $/mes |
| Postgres Neon free tier | 0 € |
| Resend free tier (3.000 emails/mes) | 0 € |
| Stripe | 1,5 % + 0,25 € por cobro (UE) — sin cuota fija |
| IA (modelo pequeño, ~1–2k tokens por generación) | céntimos por usuario/mes; tope por plan |
| Dominio .es | ~10 €/año |

> Nota: el plan Hobby de Vercel no permite uso comercial; para cobrar, Vercel Pro o alternativa (Railway, Fly, VPS con Docker).
