import "server-only";
import { env } from "@/lib/env";
import { logError } from "@/lib/errors";

export type EmailMessage = { to: string; subject: string; text: string; html?: string; replyTo?: string };

/**
 * Envía un email con Resend (API HTTP, sin SDK).
 * Sin RESEND_API_KEY: en desarrollo se muestra por consola; en producción se registra un error.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = env.email.resendApiKey;
  if (!apiKey) {
    if (!env.isProduction) {
      console.info(`[email:dev] Para: ${message.to}\nAsunto: ${message.subject}\n${message.text}`);
      return true;
    }
    logError("email", new Error("RESEND_API_KEY no configurada"));
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.email.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
        reply_to: message.replyTo,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      logError("email", new Error(`Resend respondió ${res.status}`));
      return false;
    }
    return true;
  } catch (error) {
    logError("email", error);
    return false;
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function resetPasswordEmail(name: string, url: string): Omit<EmailMessage, "to"> {
  const text = `Hola ${name},\n\nHas pedido cambiar tu contraseña de Presupuéstalo. Abre este enlace (caduca en 1 hora):\n\n${url}\n\nSi no has sido tú, ignora este mensaje.`;
  const html = `<p>Hola ${escapeHtml(name)},</p><p>Has pedido cambiar tu contraseña de Presupuéstalo.</p><p><a href="${escapeHtml(url)}">Cambiar mi contraseña</a> (caduca en 1 hora)</p><p>Si no has sido tú, ignora este mensaje.</p>`;
  return { subject: "Cambia tu contraseña de Presupuéstalo", text, html };
}
