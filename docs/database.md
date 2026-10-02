# Modelo de datos

Fuente de verdad: `prisma/schema.prisma`. Importes en **céntimos (Int)** para evitar errores de coma flotante.
Cantidades en `Decimal(12,2)`.

```
User 1─1 BusinessProfile
User 1─1 Subscription
User 1─N Client
User 1─N Quote 1─N QuoteItem
Client 1─N Quote (opcional; el presupuesto guarda copia de los datos del cliente)
User 1─N Session / Account (Better Auth)
User 1─N AiUsage, AuditLog, AnalyticsEvent
Verification, RateLimit, StripeEvent, ContactMessage (independientes)
```

## Entidades

| Modelo | Campos clave | Índices / notas |
|---|---|---|
| **User** | id, name, email, emailVerified | email único (Better Auth) |
| Session / Account / Verification | tablas Better Auth | token único; Account guarda el hash de contraseña |
| **BusinessProfile** | businessName, taxId, address, city, postalCode, phone, email, defaultVatRate, defaultNotes, quoteSeq, onboardedAt | userId único. `quoteSeq` se incrementa atómicamente para numerar |
| **Plan** | enum `FREE` / `PRO` + configuración en `src/lib/plans.ts` | Los límites viven en código (versionados); el `priceId` de Stripe en env. Evita una tabla que duplicaría la config de Stripe |
| **Subscription** | plan, status, stripeCustomerId, stripeSubscriptionId, stripePriceId, currentPeriodEnd, cancelAtPeriodEnd | userId único; ids Stripe únicos. Solo la escribe el webhook / sync servidor |
| **Client** | name, taxId, email, phone, address | índice (userId, name) |
| **Quote** | number, title, status, issueDate, validUntil, vatRate, irpfRate, notes, client* (copia), subtotalCents, vatCents, irpfCents, totalCents, publicToken, sentAt, viewedAt, respondedAt | único (userId, number); publicToken único; índice (userId, createdAt), (userId, status) |
| **QuoteItem** | position, description, quantity, unit, unitPriceCents, totalCents | índice quoteId; borrado en cascada |
| **UsageCounter** | period ("YYYY-MM"), quotesCreated | único (userId, period). Solo sube: borrar no devuelve cupo; se incrementa en la transacción de creación |
| **AiUsage** | success, inputTokens, outputTokens, model | índice (userId, createdAt) — base del límite mensual y control de coste |
| **AuditLog** | action, entity, entityId, metadata | índice (userId, createdAt) |
| **AnalyticsEvent** | name, props | índice (name, createdAt) |
| **RateLimit** | key, count, windowStart | key único |
| **StripeEvent** | id (event id), type | idempotencia de webhooks |
| **ContactMessage** | name, email, message | |

## Duplicación consciente
- **Totales del presupuesto** se guardan (calculados siempre en servidor con `lib/quote-math.ts`) para listar y
  hacer estadísticas sin recalcular. Se recalculan en cada guardado.
- **Datos del cliente** se copian en el presupuesto: un presupuesto enviado/aceptado no debe cambiar si
  después se edita la ficha del cliente (valor documental).
