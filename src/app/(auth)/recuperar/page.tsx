import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "@/components/auth/forgot-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Recuperar contraseña", robots: { index: false } };

export default function ForgotPage() {
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Recupera tu contraseña</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Te enviaremos un enlace para crear una nueva.</p>
      <ForgotForm />
      <p className="mt-6 text-center text-sm">
        <Link href="/entrar" className="font-medium text-brand-700 hover:underline">
          Volver a entrar
        </Link>
      </p>
    </Card>
  );
}
