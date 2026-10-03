import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/app/profile-form";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { getProfile } from "@/services/profile";

export const metadata: Metadata = { title: "Bienvenida", robots: { index: false } };

export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (profile?.onboardedAt) redirect("/panel");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface">
      <header className="px-4 py-5 sm:px-6">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-lg px-4 pb-16">
        <p className="text-sm font-semibold text-brand-700">Paso 1 de 1 · 30 segundos</p>
        <h1 className="mt-1 text-2xl font-bold">Hola, {user.name.split(" ")[0]}. ¿Cómo se llama tu negocio?</h1>
        <p className="mb-6 mt-1 text-sm text-muted">
          Estos datos aparecen en la cabecera de tus presupuestos. Podrás completarlos o cambiarlos después en Ajustes.
        </p>
        <Card className="p-6">
          <ProfileForm initial={{ businessName: user.name }} submitLabel="Empezar a hacer presupuestos" redirectTo="/panel/presupuestos/nuevo" compact />
        </Card>
      </main>
    </div>
  );
}
