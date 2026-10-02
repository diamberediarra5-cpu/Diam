import type { Metadata } from "next";
import { ClientManager } from "@/components/app/client-manager";
import { PageHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { listClients } from "@/services/clients";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientsPage({ searchParams }: PageProps<"/panel/clientes">) {
  const user = await requireUser();
  const sp = await searchParams;
  const search = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const clients = await listClients(user.id, search);
  return (
    <div>
      <PageHeader title="Clientes" description="Tus clientes se guardan solos al hacer un presupuesto." />
      <ClientManager
        search={search}
        clients={clients.map(({ id, name, taxId, email, phone, address, _count }) => ({ id, name, taxId, email, phone, address, quotes: _count.quotes }))}
      />
    </div>
  );
}
