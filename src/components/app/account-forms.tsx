"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateNameAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { PASSWORD_MIN } from "@/validation/auth";

export function NameForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await updateNameAction({ name: String(new FormData(e.currentTarget).get("name") ?? "") });
        setLoading(false);
        setMsg(res.ok ? { tone: "success", text: "Nombre actualizado." } : { tone: "error", text: res.fieldErrors?.name ?? res.error });
        if (res.ok) router.refresh();
      }}
    >
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      <Field label="Tu nombre" htmlFor="acc-name">
        <Input id="acc-name" name="name" defaultValue={name} autoComplete="name" />
      </Field>
      <Field label="Email de acceso" htmlFor="acc-email" hint="Para cambiar el email de acceso, escríbenos.">
        <Input id="acc-email" value={email} disabled readOnly />
      </Field>
      <Button type="submit" variant="secondary" loading={loading}>
        Guardar
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const currentPassword = String(fd.get("currentPassword") ?? "");
        const newPassword = String(fd.get("newPassword") ?? "");
        if (newPassword.length < PASSWORD_MIN) return setMsg({ tone: "error", text: `La nueva contraseña debe tener al menos ${PASSWORD_MIN} caracteres.` });
        setLoading(true);
        const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
        setLoading(false);
        if (error) return setMsg({ tone: "error", text: error.code === "INVALID_PASSWORD" ? "La contraseña actual no es correcta." : authErrorMessage(error) });
        form.reset();
        setMsg({ tone: "success", text: "Contraseña cambiada. Hemos cerrado la sesión en tus otros dispositivos." });
      }}
    >
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      <Field label="Contraseña actual" htmlFor="currentPassword">
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" />
      </Field>
      <Field label="Nueva contraseña" htmlFor="newPassword" hint="Mínimo 8 caracteres">
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" />
      </Field>
      <Button type="submit" variant="secondary" loading={loading}>
        Cambiar contraseña
      </Button>
    </form>
  );
}
