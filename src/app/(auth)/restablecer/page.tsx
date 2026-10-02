import type { Metadata } from "next";
import { ResetForm } from "@/components/auth/reset-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Nueva contraseña", robots: { index: false } };

export default async function ResetPage({ searchParams }: PageProps<"/restablecer">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" && sp.token.length > 10 && !sp.error ? sp.token : null;
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-bold">Elige una nueva contraseña</h1>
      <ResetForm token={token} />
    </Card>
  );
}
