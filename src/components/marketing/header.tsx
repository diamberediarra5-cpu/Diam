import Link from "next/link";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo />
        <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-4">
          <Link href="/precios" className="hidden rounded px-2 py-1 text-sm font-medium text-slate-600 hover:text-ink sm:inline">
            Precios
          </Link>
          <Link href="/contacto" className="hidden rounded px-2 py-1 text-sm font-medium text-slate-600 hover:text-ink sm:inline">
            Contacto
          </Link>
          <Link href="/entrar" className="rounded px-2 py-1 text-sm font-medium text-slate-600 hover:text-ink">
            Entrar
          </Link>
          <ButtonLink href="/registro" size="sm">
            Empezar gratis
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
