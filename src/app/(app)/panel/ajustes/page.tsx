import type { Metadata } from "next";
import { NameForm, PasswordForm } from "@/components/app/account-forms";
import { ProfileForm } from "@/components/app/profile-form";
import { SignOutButton } from "@/components/app/sign-out-button";
import { Card, PageHeader } from "@/components/ui/card";
import { site } from "@/lib/site";
import { requireUser } from "@/lib/session";
import { getProfile } from "@/services/profile";

export const metadata: Metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return (
    <div className="space-y-6">
      <PageHeader title="Ajustes" description="Los datos de tu negocio aparecen en todos tus presupuestos." />
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Datos del negocio</h2>
        <ProfileForm initial={profile} submitLabel="Guardar cambios" />
      </Card>
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Tu cuenta</h2>
        <NameForm name={user.name} email={user.email} />
      </Card>
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Contraseña</h2>
        <PasswordForm />
      </Card>
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="text-sm text-muted">
          ¿Quieres borrar tu cuenta y tus datos? Escríbenos a{" "}
          <a className="font-medium text-brand-700 underline" href={`mailto:${site.supportEmail}`}>
            {site.supportEmail}
          </a>{" "}
          y lo hacemos en 48 h.
        </p>
        <SignOutButton />
      </Card>
    </div>
  );
}
