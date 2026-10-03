"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { createClient, deleteClient, updateClient } from "@/services/clients";
import type { ClientInput } from "@/validation/client";
import { run } from "./run";

export async function saveClientAction(id: string | null, input: ClientInput) {
  const user = await requireUser();
  return run("clients.save", async () => {
    const client = id ? await updateClient(user.id, id, input) : await createClient(user.id, input);
    revalidatePath("/panel/clientes");
    return { id: client.id };
  });
}

export async function deleteClientAction(id: string) {
  const user = await requireUser();
  return run("clients.delete", async () => {
    await deleteClient(user.id, id);
    revalidatePath("/panel/clientes");
    return undefined;
  });
}
