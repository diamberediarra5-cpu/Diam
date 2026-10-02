"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input, Select, Textarea } from "@/components/ui/form";
import { fieldErrors } from "@/validation/common";
import { businessProfileSchema, VAT_RATES } from "@/validation/profile";

type Profile = {
  businessName: string;
  taxId: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  defaultVatRate: number;
  defaultNotes: string | null;
};

export function ProfileForm({
  initial,
  submitLabel,
  redirectTo,
  compact = false,
}: {
  initial?: Partial<Profile> | null;
  submitLabel: string;
  redirectTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = businessProfileSchema.safeParse(raw);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setFormError("");
    setSaved(false);
    setLoading(true);
    const res = await saveProfileAction(raw as never);
    setLoading(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      setFormError(res.error);
      return;
    }
    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
    } else {
      setSaved(true);
      router.refresh();
    }
  }

  const v = (k: keyof Profile) => (initial?.[k] ?? "") as string;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <Alert>{formError}</Alert>}
      {saved && <Alert tone="success">Cambios guardados.</Alert>}
      <Field label="Nombre del negocio o tu nombre comercial" htmlFor="businessName" error={errors.businessName}>
        <Input id="businessName" name="businessName" defaultValue={v("businessName")} autoComplete="organization" required aria-invalid={!!errors.businessName} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="NIF / CIF" htmlFor="taxId" error={errors.taxId} hint="Aparece en tus presupuestos">
          <Input id="taxId" name="taxId" defaultValue={v("taxId")} aria-invalid={!!errors.taxId} />
        </Field>
        <Field label="Teléfono" htmlFor="phone" error={errors.phone}>
          <Input id="phone" name="phone" type="tel" defaultValue={v("phone")} autoComplete="tel" aria-invalid={!!errors.phone} />
        </Field>
      </div>
      {!compact && (
        <>
          <Field label="Email de contacto" htmlFor="email" error={errors.email}>
            <Input id="email" name="email" type="email" defaultValue={v("email")} autoComplete="email" aria-invalid={!!errors.email} />
          </Field>
          <Field label="Dirección" htmlFor="address" error={errors.address}>
            <Input id="address" name="address" defaultValue={v("address")} autoComplete="street-address" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ciudad" htmlFor="city" error={errors.city}>
              <Input id="city" name="city" defaultValue={v("city")} autoComplete="address-level2" />
            </Field>
            <Field label="Código postal" htmlFor="postalCode" error={errors.postalCode}>
              <Input id="postalCode" name="postalCode" inputMode="numeric" defaultValue={v("postalCode")} autoComplete="postal-code" aria-invalid={!!errors.postalCode} />
            </Field>
          </div>
        </>
      )}
      <Field label="IVA que aplicas normalmente" htmlFor="defaultVatRate" error={errors.defaultVatRate}>
        <Select id="defaultVatRate" name="defaultVatRate" defaultValue={String(initial?.defaultVatRate ?? 21)}>
          {VAT_RATES.map((r) => (
            <option key={r} value={r}>
              {r} %{r === 10 ? " (reformas de vivienda)" : r === 0 ? " (exento)" : ""}
            </option>
          ))}
        </Select>
      </Field>
      {!compact && (
        <Field
          label="Condiciones por defecto"
          htmlFor="defaultNotes"
          error={errors.defaultNotes}
          hint="Se añaden a cada presupuesto nuevo. Ej.: forma de pago, plazos, garantía."
        >
          <Textarea id="defaultNotes" name="defaultNotes" rows={4} defaultValue={v("defaultNotes")} />
        </Field>
      )}
      <Button type="submit" size="lg" className="w-full sm:w-auto" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
