import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <Logo />
      <h1 className="mt-10 text-3xl font-bold">No encontramos esta página</h1>
      <p className="mt-2 max-w-md text-muted">Puede que el enlace esté mal escrito o que el presupuesto se haya eliminado.</p>
      <ButtonLink href="/" className="mt-8">
        Ir al inicio
      </ButtonLink>
    </main>
  );
}
