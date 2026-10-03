import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  if (await getSession()) redirect("/panel");
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Entra en tu cuenta</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-brand-700 hover:underline">
          Regístrate gratis
        </Link>
      </p>
      {sp.cambiada && (
        <div className="mb-4">
          <Alert tone="success">Contraseña cambiada. Ya puedes entrar.</Alert>
        </div>
      )}
      <SignInForm next={next} />
    </Card>
  );
}
