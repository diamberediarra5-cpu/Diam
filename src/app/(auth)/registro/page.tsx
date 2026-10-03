import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Card } from "@/components/ui/card";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Crear cuenta gratis",
  description: "Crea tu cuenta gratis y haz tu primer presupuesto profesional en 2 minutos.",
};

export default async function SignUpPage() {
  if (await getSession()) redirect("/panel");
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Crea tu cuenta gratis</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Sin tarjeta. ¿Ya tienes cuenta?{" "}
        <Link href="/entrar" className="font-semibold text-brand-700 hover:underline">
          Entra
        </Link>
      </p>
      <SignUpForm />
    </Card>
  );
}
