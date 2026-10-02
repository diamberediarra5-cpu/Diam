"use client";

import { useState } from "react";
import { contactAction } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input, Textarea } from "@/components/ui/form";
import { contactSchema } from "@/validation/auth";
import { fieldErrors } from "@/validation/common";

export function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (sent) return <Alert tone="success">¡Mensaje enviado! Te respondemos en menos de 24 h laborables.</Alert>;

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        const parsed = contactSchema.safeParse(raw);
        if (!parsed.success) return setErrors(fieldErrors(parsed.error));
        setErrors({});
        setFormError("");
        setLoading(true);
        const res = await contactAction(raw as never);
        setLoading(false);
        if (!res.ok) {
          setErrors(res.fieldErrors ?? {});
          return setFormError(res.error);
        }
        setSent(true);
      }}
    >
      {formError && <Alert>{formError}</Alert>}
      <Field label="Nombre" htmlFor="name" error={errors.name}>
        <Input id="name" name="name" autoComplete="name" aria-invalid={!!errors.name} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} />
      </Field>
      <Field label="¿En qué te ayudamos?" htmlFor="message" error={errors.message}>
        <Textarea id="message" name="message" rows={5} aria-invalid={!!errors.message} />
      </Field>
      {/* Honeypot: oculto para personas */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">No rellenar</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <Button type="submit" size="lg" loading={loading}>
        Enviar mensaje
      </Button>
    </form>
  );
}
