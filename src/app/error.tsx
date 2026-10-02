"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Algo ha fallado</h1>
      <p className="mt-2 max-w-md text-muted">No es culpa tuya. Vuelve a intentarlo en unos segundos. Si sigue pasando, escríbenos.</p>
      <Button className="mt-8" onClick={reset}>
        Reintentar
      </Button>
    </main>
  );
}
