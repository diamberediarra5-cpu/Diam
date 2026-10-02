import Link from "next/link";
import { Logo } from "@/components/logo";
import { site } from "@/lib/site";

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">Presupuestos profesionales para autónomos y pequeñas empresas de oficios en España.</p>
        </div>
        <nav aria-label="Producto" className="text-sm">
          <p className="font-semibold">Producto</p>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li><Link href="/#como-funciona" className="hover:text-ink">Cómo funciona</Link></li>
            <li><Link href="/precios" className="hover:text-ink">Precios</Link></li>
            <li><Link href="/registro" className="hover:text-ink">Crear cuenta</Link></li>
            <li><Link href="/entrar" className="hover:text-ink">Entrar</Link></li>
          </ul>
        </nav>
        <nav aria-label="Legal" className="text-sm">
          <p className="font-semibold">Ayuda y legal</p>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li><Link href="/contacto" className="hover:text-ink">Contacto</Link></li>
            <li><Link href="/terminos" className="hover:text-ink">Términos y condiciones</Link></li>
            <li><Link href="/privacidad" className="hover:text-ink">Privacidad y cookies</Link></li>
          </ul>
        </nav>
      </div>
      <p className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {site.name}. Hecho en España.
      </p>
    </footer>
  );
}
