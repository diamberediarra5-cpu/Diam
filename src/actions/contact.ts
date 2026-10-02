"use server";

import { submitContact } from "@/services/contact";
import { clientIp, run } from "./run";

export async function contactAction(input: { name: string; email: string; message: string; website?: string }) {
  return run("contact", async () => {
    await submitContact(input, await clientIp());
    return undefined;
  });
}
