import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { clientSchema, type ClientInput } from "@/validation/client";

const NOT_FOUND = new AppError("No hemos encontrado ese cliente.", "NOT_FOUND");

export function listClients(userId: string, search?: string) {
  const q = search?.trim();
  return db.client.findMany({
    where: {
      userId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: 200,
    include: { _count: { select: { quotes: true } } },
  });
}

export async function getClient(userId: string, id: string) {
  const client = await db.client.findFirst({ where: { id, userId } });
  if (!client) throw NOT_FOUND;
  return client;
}

export function createClient(userId: string, input: ClientInput) {
  const data = clientSchema.parse(input);
  return db.client.create({ data: { ...data, userId } });
}

export async function updateClient(userId: string, id: string, input: ClientInput) {
  const data = clientSchema.parse(input);
  // updateMany con userId en el where: imposible modificar un cliente ajeno.
  const { count } = await db.client.updateMany({ where: { id, userId }, data });
  if (count === 0) throw NOT_FOUND;
  return getClient(userId, id);
}

export async function deleteClient(userId: string, id: string) {
  // Los presupuestos conservan su copia de los datos del cliente (clientId → null).
  const { count } = await db.client.deleteMany({ where: { id, userId } });
  if (count === 0) throw NOT_FOUND;
}
