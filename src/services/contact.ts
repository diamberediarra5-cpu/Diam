import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { contactSchema } from "@/validation/auth";
import { sendEmail } from "./email";
import { enforceRateLimit } from "./rate-limit";

export async function submitContact(input: unknown, ip: string) {
  const data = contactSchema.parse(input);
  await enforceRateLimit(`contact:${ip}`, 3, 10 * 60_000);
  await db.contactMessage.create({ data: { name: data.name, email: data.email, message: data.message } });
  if (env.email.contactInbox) {
    await sendEmail({
      to: env.email.contactInbox,
      replyTo: data.email,
      subject: `Contacto web: ${data.name}`,
      text: `${data.name} <${data.email}>\n\n${data.message}`,
    });
  }
}
