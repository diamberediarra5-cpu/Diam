"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { fieldErrors } from "@/validation/common";
import { signUpSchema } from "@/validation/auth";

export function SignUpForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      password: fd.get("password"),
      acceptTerms: fd.get("acceptTerms") === "on",
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setFormError("");
    setLoading(true);
    const { error } = await authClient.signUp.email({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) {
      setLoading(false);
      setFormError(authErrorMessage(error));
      return;
    }
    router.push("/bienvenida");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <Alert>{formError}</Alert>}
      <Field label="Tu nombre" htmlFor="name" error={errors.name}>
        <Input id="name" name="name" autoComplete="name" required aria-invalid={!!errors.name} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required aria-invalid={!!errors.email} />
      </Field>
      <Field label="Contraseña" htmlFor="password" error={errors.password} hint="Mínimo 8 caracteres">
        <Input id="password" name="password" type="password" autoComplete="new-password" required aria-invalid={!!errors.password} />
      </Field>
      <div className="space-y-1">
        <label className="flex items-start gap-2 text-sm text-muted">
          <input type="checkbox" name="acceptTerms" className="mt-0.5 h-4 w-4 rounded border-line accent-brand-700" />
          <span>
            Acepto los{" "}
            <Link href="/terminos" className="font-medium text-brand-700 underline" target="_blank">
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" className="font-medium text-brand-700 underline" target="_blank">
              política de privacidad
            </Link>
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600" role="alert">
            {errors.acceptTerms}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Crear cuenta gratis
      </Button>
    </form>
  );
}
