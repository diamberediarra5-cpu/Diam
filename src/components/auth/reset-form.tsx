"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { PASSWORD_MIN } from "@/validation/auth";

export function ResetForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <Alert>
        El enlace no es válido o ha caducado.{" "}
        <Link href="/recuperar" className="font-semibold underline">
          Pide uno nuevo
        </Link>
        .
      </Alert>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    if (password.length < PASSWORD_MIN) return setError(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`);
    if (password !== confirm) return setError("Las contraseñas no coinciden.");
    setError("");
    setLoading(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
    if (error) {
      setLoading(false);
      setError(authErrorMessage(error));
      return;
    }
    router.push("/entrar?cambiada=1");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <Field label="Nueva contraseña" htmlFor="password" hint="Mínimo 8 caracteres">
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Repite la contraseña" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Guardar contraseña
      </Button>
    </form>
  );
}
