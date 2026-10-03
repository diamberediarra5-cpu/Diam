# Presupuéstalo — Especificación de producto (MVP)

> Las plantillas del prompt original llegaron sin rellenar (nombre, problema, cliente, precio).
> Se ha tomado una decisión razonable y se documenta aquí. Cambiar de idea reutiliza el 80 % del código
> (auth, billing, dashboard, IA, landing, infraestructura).

## 1. Problema

Los autónomos de oficios (reformistas, fontaneros, electricistas, pintores, carpinteros, talleres)
hacen los presupuestos **por la noche, en Word/Excel o a mano**:

- Tardan 20–60 min por presupuesto (redactar partidas, calcular IVA, maquetar).
- El resultado parece poco profesional → pierden trabajos frente a empresas.
- Lo envían como foto/PDF por WhatsApp y **no saben si el cliente lo ha visto** ni cuándo hacer seguimiento.
- Errores de cálculo (IVA, retención IRPF) que cuestan dinero.

## 2. Cliente objetivo

- **Primario:** autónomo de oficios en España, 1–5 personas, usa el móvil más que el ordenador,
  no técnico. Hace 5–40 presupuestos al mes.
- **Secundario:** pequeños talleres y empresas de reformas.

## 3. Resultado para el cliente

- Presupuesto profesional en **< 3 minutos** (desde el móvil, a pie de obra).
- La IA redacta las partidas a partir de una frase ("cambiar bañera por plato de ducha 120x80…").
- El cliente recibe **un enlace** (WhatsApp/email), lo ve bonito, lo **acepta con un clic** y lo puede imprimir/guardar en PDF.
- El autónomo ve el estado: borrador → enviado → visto → aceptado/rechazado.

## 4. Modelo de negocio

Freemium con suscripción mensual (Stripe).

| | Gratis | Pro — 9,90 €/mes (IVA incl.) |
|---|---|---|
| Presupuestos nuevos / mes | 5 | Ilimitados |
| Generaciones con IA / mes | 3 | 100 |
| Enlace para aceptar online | Sí | Sí |
| Pie "Hecho con Presupuéstalo" | Sí | No |
| Clientes guardados | Ilimitados | Ilimitados |

Mercado inicial: España. Idioma: español. Moneda: EUR.

## 5. Funcionalidades MVP (incluidas)

1. Registro, login, logout, recuperación de contraseña, perfil.
2. Onboarding (1 pantalla): datos del negocio (nombre, NIF, dirección, teléfono, IVA por defecto).
3. Clientes: crear, editar, eliminar, listar.
4. Presupuestos: crear, editar, duplicar, eliminar; partidas con cantidad, unidad, precio;
   IVA (21/10/4/0) y retención IRPF opcional; numeración automática; validez; notas.
5. **IA**: "Describe el trabajo" → partidas propuestas (editables). Con límite mensual por plan.
6. Enlace público por presupuesto (token no adivinable): ver, imprimir/PDF, aceptar o rechazar.
7. Compartir por WhatsApp / copiar enlace.
8. Dashboard: resumen del mes, acción principal, presupuestos recientes.
9. Suscripción: Stripe Checkout, Customer Portal (cancelar/cambiar tarjeta), webhooks verificados.
10. Landing, precios, contacto, términos, privacidad.
11. Analítica propia (tabla de eventos, sin terceros, sin cookies de tracking).

## 6. Eliminado conscientemente (fuera del MVP)

- Facturas / Verifactu / TicketBAI (complejo y regulado; V2 natural).
- Subida de logo (evita superficie de ataque de ficheros en el MVP).
- Equipos / multiusuario, roles.
- Catálogo de precios, plantillas, multi-moneda, multi-idioma.
- Envío de email del presupuesto desde la app (WhatsApp y copiar enlace cubren el caso; ahorra coste).
- Firma electrónica avanzada.
- Generación de PDF en servidor (se usa impresión del navegador con CSS de impresión → "Guardar como PDF").

## 7. Usuarios y flujos

### Flujo principal
```
Landing → Registro → Onboarding (datos negocio) → Dashboard
  → "Nuevo presupuesto" → Cliente (existente o nuevo) → Describe trabajo → [IA genera partidas]
  → Ajustar precios/cantidades → Guardar → Compartir por WhatsApp
  → Cliente abre enlace (estado "Visto") → Acepta → estado "Aceptado" en el dashboard
```

### Flujo de upgrade
```
Límite alcanzado / página Suscripción → "Pasar a Pro" → Stripe Checkout → webhook → plan Pro
Suscripción → "Gestionar" → Stripe Customer Portal → cancelar → webhook → vuelve a Gratis al final del periodo
```

## 8. Cómo se probará cada funcionalidad

| Funcionalidad | Test automático | Manual (E2E navegador) |
|---|---|---|
| Cálculo de totales (IVA, IRPF, redondeo) | Unit | — |
| Validación de formularios (Zod) | Unit | Errores visibles |
| Registro/login/logout | Integración (API Better Auth) | Playwright |
| Recuperación de contraseña | Integración (token en BD) | — |
| CRUD clientes/presupuestos + ownership | Integración contra Postgres | Playwright |
| Límites de plan | Integración | — |
| IA (parser + límites + errores) | Unit con proveedor simulado | Bloqueado sin API key |
| Enlace público + aceptar | Integración | Playwright |
| Webhook Stripe (firma, estados) | Integración con firma generada | Bloqueado sin claves |
| Build/lint/typecheck | CI local | — |

## 9. Métricas (eventos)

`signup`, `login`, `onboarding_completed`, `main_action_started` (abre "nuevo presupuesto"),
`main_action_completed` (guarda presupuesto), `quote_shared`, `quote_accepted`, `ai_generated`,
`upgrade_clicked`, `subscription_started`, `subscription_cancelled`.

## 10. SEO — palabras clave objetivo

"hacer presupuestos online", "programa de presupuestos para autónomos", "presupuesto de reforma",
"app presupuestos fontanero", "plantilla presupuesto autónomo", "presupuestos desde el móvil".
