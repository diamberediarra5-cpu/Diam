import "server-only";
import { db } from "@/lib/db";
import { businessProfileSchema, type BusinessProfileInput } from "@/validation/profile";
import { track } from "./analytics";

export function getProfile(userId: string) {
  return db.businessProfile.findUnique({ where: { userId } });
}

export async function saveProfile(userId: string, input: BusinessProfileInput) {
  const data = businessProfileSchema.parse(input);
  const existing = await getProfile(userId);
  const profile = await db.businessProfile.upsert({
    where: { userId },
    create: { userId, ...data, onboardedAt: new Date() },
    update: { ...data, onboardedAt: existing?.onboardedAt ?? new Date() },
  });
  if (!existing?.onboardedAt) await track("onboarding_completed", userId);
  return profile;
}
