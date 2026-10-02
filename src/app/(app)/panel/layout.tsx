import { redirect } from "next/navigation";
import { BottomNav, SideNav } from "@/components/app/nav";
import { SignOutButton } from "@/components/app/sign-out-button";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/session";
import { getProfile } from "@/services/profile";

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile?.onboardedAt) redirect("/bienvenida");

  return (
    <div className="flex min-h-full flex-1 bg-surface">
      <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white px-4 py-5 lg:flex">
        <Logo href="/panel" />
        <ButtonLink href="/panel/presupuestos/nuevo" className="mt-6 w-full">
          + Nuevo presupuesto
        </ButtonLink>
        <div className="mt-6 flex-1">
          <SideNav />
        </div>
        <div className="border-t border-line pt-4">
          <p className="truncate text-sm font-medium">{profile.businessName}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
          <SignOutButton className="mt-2" />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <Logo href="/panel" />
          <ButtonLink href="/panel/presupuestos/nuevo" size="sm">
            + Nuevo
          </ButtonLink>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
