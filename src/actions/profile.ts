"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { saveProfile } from "@/services/profile";
import type { BusinessProfileInput } from "@/validation/profile";
import { nameSchema } from "@/validation/profile";
import { run } from "./run";

export async function saveProfileAction(input: BusinessProfileInput) {
  const user = await requireUser();
  return run("profile.save", async () => {
    await saveProfile(user.id, input);
    revalidatePath("/panel", "layout");
    return undefined;
  });
}

export async function updateNameAction(input: { name: string }) {
  const user = await requireUser();
  return run("profile.name", async () => {
    const { name } = nameSchema.parse(input);
    await db.user.update({ where: { id: user.id }, data: { name } });
    revalidatePath("/panel", "layout");
    return undefined;
  });
}
