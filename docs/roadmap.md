# Roadmap

## MVP (este repositorio)
| Fase | Contenido | Estado |
|---|---|---|
| 1–2 | Producto y arquitectura | ✅ |
| 3–4 | Proyecto Next.js, Prisma, esquema y migración | ✅ |
| 5 | Auth (registro, login, logout, reset, perfil, protección rutas) | ✅ |
| 6 | Dashboard + onboarding | ✅ |
| 7 | Clientes + presupuestos + enlace público | ✅ |
| 8–9 | Landing, precios, contacto, legal | ✅ |
| 10 | Stripe (checkout, portal, webhook) | ✅ |
| 11 | IA (proveedor intercambiable, límites) | ✅ |
| 12 | Tests unit/integración/E2E | ✅ |
| 13–18 | Seguridad, SEO, UX, build, docs, deploy | ✅ |

Pendiente para lanzar: claves reales (Stripe live, Resend, Anthropic), dominio, textos legales revisados por un profesional.

## V2 (tras validar con 10–20 usuarios de pago)
1. Convertir presupuesto aceptado en **factura** (con Verifactu cuando sea obligatorio).
2. Logo del negocio en el presupuesto (subida a almacenamiento con validación de tipo/tamaño).
3. Catálogo de precios propio y que la IA lo use para proponer importes reales.
4. Recordatorio automático de seguimiento (email al autónomo si el cliente no responde en X días).
5. Envío del presupuesto por email desde la app.
6. Plan anual con descuento.
