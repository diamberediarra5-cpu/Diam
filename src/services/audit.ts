import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { logError } from "@/lib/errors";

export async function audit(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string | null,
  metadata?: Prisma.InputJsonValue,
) {
  try {
    await db.auditLog.create({ data: { userId, action, entity, entityId: entityId ?? null, metadata } });
  } catch (error) {
    logError("audit", error);
  }
}
