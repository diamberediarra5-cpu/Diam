"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, safeNext } from "@/lib/auth-errors";
import { fieldErrors } from "@/validation/common";
import { signInSchema } from "@/validation/auth";

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setFormError("");
    setLoading(true);
    const { error } = await authClient.signIn.email({ ...parsed.data, rememberMe: true });
    if (error) {
      setLoading(false);
      setFormError(authErrorMessage(error));
      return;
    }
    router.push(safeNext(next));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <Alert>{formError}</Alert>}
      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required aria-invalid={!!errors.email} />
      </Field>
      <Field label="Contraseña" htmlFor="password" error={errors.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={!!errors.password} />
      </Field>
      <div className="text-right text-sm">
        <Link href="/recuperar" className="font-medium text-brand-700 hover:underline">
          ¿Has olvidado tu contraseña?
        </Link>
      </div>
      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Entrar
      </Button>
    </form>
  );
}
