"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

export function ForgotForm() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = z.email().safeParse(String(new FormData(e.currentTarget).get("email") ?? "").trim().toLowerCase());
    if (!email.success) {
      setError("El email no es válido.");
      return;
    }
    setError("");
    setLoading(true);
    const { error } = await authClient.requestPasswordReset({ email: email.data, redirectTo: "/restablecer" });
    setLoading(false);
    // Por seguridad no revelamos si el email existe: misma respuesta en ambos casos.
    if (error && error.status === 429) {
      setError(authErrorMessage(error));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Alert tone="success">
        Si hay una cuenta con ese email, te hemos enviado un enlace para cambiar la contraseña. Revisa también la carpeta de spam.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <Field label="Email de tu cuenta" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required />
      </Field>
      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Enviarme el enlace
      </Button>
    </form>
  );
}
