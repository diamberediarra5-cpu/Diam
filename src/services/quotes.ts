import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma, QuoteStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isExpired, startOfMonthUtc } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { eurosToCents } from "@/lib/money";
import { computeTotals } from "@/lib/quote-math";
import { quoteSchema, type QuoteData, type QuoteInput } from "@/validation/quote";
import { track } from "./analytics";
import { audit } from "./audit";
import { assertCanCreateQuote, getPlan } from "./subscription";

const NOT_FOUND = new AppError("No hemos encontrado ese presupuesto.", "NOT_FOUND");

type Tx = Prisma.TransactionClient;

export function newPublicToken() {
  return randomBytes(24).toString("base64url");
}

function formatNumber(seq: number, date = new Date()) {
  return `${date.getUTCFullYear()}-${String(seq).padStart(4, "0")}`;
}

/** Reserva el siguiente número de forma atómica (incremento en BD). */
async function nextNumber(tx: Tx, userId: string) {
  const profile = await tx.businessProfile.update({
    where: { userId },
    data: { quoteSeq: { increment: 1 } },
    select: { quoteSeq: true },
  });
  return formatNumber(profile.quoteSeq);
}

async function requireProfile(tx: Tx, userId: string) {
  const profile = await tx.businessProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("Antes de crear presupuestos, completa los datos de tu negocio.", "CONFLICT");
}

/** Resuelve el cliente: existente (comprobando que es del usuario) o nuevo si se pide guardarlo. */
async function resolveClientId(tx: Tx, userId: string, data: QuoteData): Promise<string | null> {
  if (data.clientId) {
    const owned = await tx.client.findFirst({ where: { id: data.clientId, userId }, select: { id: true } });
    if (!owned) throw new AppError("El cliente seleccionado no existe.", "NOT_FOUND");
    return owned.id;
  }
  if (data.saveClient) {
    const created = await tx.client.create({ data: { userId, ...data.client } });
    return created.id;
  }
  return null;
}

function buildQuoteFields(data: QuoteData) {
  const lines = data.items.map((i) => ({ quantity: i.quantity, unitPriceCents: eurosToCents(i.unitPrice) }));
  const totals = computeTotals(lines, data.vatRate, data.irpfRate);
  const items = data.items.map((item, position) => ({
    position,
    description: item.description,
    quantity: item.quantity.toFixed(2),
    unit: item.unit,
    unitPriceCents: lines[position].unitPriceCents,
    totalCents: totals.lines[position],
  }));
  return {
    fields: {
      title: data.title,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      vatRate: data.vatRate,
      irpfRate: data.irpfRate,
      notes: data.notes ?? null,
      clientName: data.client.name,
      clientTaxId: data.client.taxId ?? null,
      clientEmail: data.client.email ?? null,
      clientPhone: data.client.phone ?? null,
      clientAddress: data.client.address ?? null,
      subtotalCents: totals.subtotalCents,
      vatCents: totals.vatCents,
      irpfCents: totals.irpfCents,
      totalCents: totals.totalCents,
    },
    items,
  };
}

export async function createQuote(userId: string, input: QuoteInput) {
  const data = quoteSchema.parse(input);
  const quote = await db.$transaction(async (tx) => {
    await requireProfile(tx, userId);
    await assertCanCreateQuote(userId, tx);
    const clientId = await resolveClientId(tx, userId, data);
    const number = await nextNumber(tx, userId);
    const { fields, items } = buildQuoteFields(data);
    return tx.quote.create({
      data: { ...fields, userId, clientId, number, publicToken: newPublicToken(), items: { create: items } },
    });
  });
  await track("main_action_completed", userId, { items: data.items.length });
  return quote;
}

export async function updateQuote(userId: string, id: string, input: QuoteInput) {
  const data = quoteSchema.parse(input);
  return db.$transaction(async (tx) => {
    const current = await tx.quote.findFirst({ where: { id, userId }, select: { id: true, status: true } });
    if (!current) throw NOT_FOUND;
    if (current.status === "ACCEPTED") {
      throw new AppError("Este presupuesto ya está aceptado y no se puede modificar. Duplícalo para hacer cambios.", "CONFLICT");
    }
    const clientId = await resolveClientId(tx, userId, data);
    const { fields, items } = buildQuoteFields(data);
    await tx.quoteItem.deleteMany({ where: { quoteId: id } });
    return tx.quote.update({ where: { id }, data: { ...fields, clientId, items: { create: items } } });
  });
}

export async function deleteQuote(userId: string, id: string) {
  const quote = await db.quote.findFirst({ where: { id, userId }, select: { number: true } });
  if (!quote) throw NOT_FOUND;
  await db.quote.delete({ where: { id } });
  await audit(userId, "quote.deleted", "Quote", id, { number: quote.number });
}

export async function duplicateQuote(userId: string, id: string) {
  return db.$transaction(async (tx) => {
    const source = await tx.quote.findFirst({ where: { id, userId }, include: { items: true } });
    if (!source) throw NOT_FOUND;
    await assertCanCreateQuote(userId, tx);
    const number = await nextNumber(tx, userId);
    const { id: _id, createdAt: _c, updatedAt: _u, items, ...rest } = source;
    return tx.quote.create({
      data: {
        ...rest,
        number,
        title: `${source.title} (copia)`.slice(0, 140),
        status: "DRAFT",
        issueDate: new Date(),
        publicToken: newPublicToken(),
        sentAt: null,
        viewedAt: null,
        respondedAt: null,
        items: {
          create: items.map(({ position, description, quantity, unit, unitPriceCents, totalCents }) => ({
            position,
            description,
            quantity,
            unit,
            unitPriceCents,
            totalCents,
          })),
        },
      },
    });
  });
}

export async function setQuoteStatus(userId: string, id: string, status: QuoteStatus) {
  const quote = await db.quote.findFirst({ where: { id, userId }, select: { id: true, sentAt: true } });
  if (!quote) throw NOT_FOUND;
  const now = new Date();
  await db.quote.update({
    where: { id },
    data: {
      status,
      sentAt: status === "SENT" ? (quote.sentAt ?? now) : undefined,
      respondedAt: status === "ACCEPTED" || status === "REJECTED" ? now : status === "DRAFT" ? null : undefined,
    },
  });
}

/** Al compartir: un borrador pasa a "Enviado". */
export async function markShared(userId: string, id: string) {
  const { count } = await db.quote.updateMany({
    where: { id, userId, status: "DRAFT" },
    data: { status: "SENT", sentAt: new Date() },
  });
  const exists = count > 0 || (await db.quote.count({ where: { id, userId } })) > 0;
  if (!exists) throw NOT_FOUND;
  await track("quote_shared", userId);
}

// ───────────── Lectura ─────────────

export type QuoteStatusFilter = QuoteStatus | "ALL";

export function listQuotes(userId: string, opts: { status?: QuoteStatusFilter; search?: string } = {}) {
  const q = opts.search?.trim();
  return db.quote.findMany({
    where: {
      userId,
      ...(opts.status && opts.status !== "ALL" ? { status: opts.status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { clientName: { contains: q, mode: "insensitive" } },
              { number: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      number: true,
      title: true,
      clientName: true,
      status: true,
      totalCents: true,
      createdAt: true,
      viewedAt: true,
      validUntil: true,
    },
  });
}

const fullInclude = { items: { orderBy: { position: "asc" } } } satisfies Prisma.QuoteInclude;
type FullQuote = Prisma.QuoteGetPayload<{ include: typeof fullInclude }>;

/** DTO serializable (sin Decimal) para componentes cliente. */
export function toQuoteDto(q: FullQuote) {
  return {
    ...q,
    items: q.items.map((i) => ({ ...i, quantity: Number(i.quantity.toString()) })),
  };
}
export type QuoteDto = ReturnType<typeof toQuoteDto>;

export async function getQuote(userId: string, id: string) {
  const quote = await db.quote.findFirst({ where: { id, userId }, include: fullInclude });
  if (!quote) throw NOT_FOUND;
  return toQuoteDto(quote);
}

export async function dashboardStats(userId: string) {
  const since = startOfMonthUtc();
  const [monthCount, pending, acceptedAgg, recent, monthDecided] = await Promise.all([
    db.quote.count({ where: { userId, createdAt: { gte: since } } }),
    db.quote.aggregate({ where: { userId, status: "SENT" }, _count: true, _sum: { totalCents: true } }),
    db.quote.aggregate({
      where: { userId, status: "ACCEPTED", respondedAt: { gte: since } },
      _count: true,
      _sum: { totalCents: true },
    }),
    listQuotes(userId).then((r) => r.slice(0, 5)),
    db.quote.count({ where: { userId, status: { in: ["ACCEPTED", "REJECTED"] }, respondedAt: { gte: since } } }),
  ]);
  return {
    monthCount,
    pendingCount: pending._count,
    pendingCents: pending._sum.totalCents ?? 0,
    acceptedCount: acceptedAgg._count,
    acceptedCents: acceptedAgg._sum.totalCents ?? 0,
    acceptanceRate: monthDecided > 0 ? Math.round((acceptedAgg._count / monthDecided) * 100) : null,
    recent,
  };
}

// ───────────── Vista pública (cliente final) ─────────────

export async function getPublicQuote(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const quote = await db.quote.findUnique({ where: { publicToken: token }, include: fullInclude });
  if (!quote) return null;
  const [profile, plan] = await Promise.all([
    db.businessProfile.findUnique({ where: { userId: quote.userId } }),
    getPlan(quote.userId),
  ]);
  return { quote: toQuoteDto(quote), profile, showBranding: plan.branding };
}

/** Marca como visto la primera vez que lo abre alguien que no es el propietario. */
export async function markViewed(token: string, viewerUserId?: string | null) {
  await db.quote.updateMany({
    where: { publicToken: token, viewedAt: null, ...(viewerUserId ? { NOT: { userId: viewerUserId } } : {}) },
    data: { viewedAt: new Date() },
  });
}

export async function respondToQuote(token: string, decision: "ACCEPTED" | "REJECTED") {
  const quote = await db.quote.findUnique({
    where: { publicToken: token },
    select: { id: true, userId: true, status: true, validUntil: true },
  });
  if (!quote) throw NOT_FOUND;
  if (quote.status === "ACCEPTED" || quote.status === "REJECTED") {
    throw new AppError("Este presupuesto ya tiene una respuesta registrada.", "CONFLICT");
  }
  if (isExpired(quote.validUntil)) {
    throw new AppError("Este presupuesto ha caducado. Pide uno nuevo a quien te lo envió.", "CONFLICT");
  }
  // Condición en el where para evitar dobles respuestas concurrentes.
  const { count } = await db.quote.updateMany({
    where: { id: quote.id, status: { in: ["DRAFT", "SENT"] } },
    data: { status: decision, respondedAt: new Date(), viewedAt: undefined },
  });
  if (count === 0) throw new AppError("Este presupuesto ya tiene una respuesta registrada.", "CONFLICT");
  await audit(null, decision === "ACCEPTED" ? "quote.accepted" : "quote.rejected", "Quote", quote.id);
  await track(decision === "ACCEPTED" ? "quote_accepted" : "quote_rejected", quote.userId);
}
