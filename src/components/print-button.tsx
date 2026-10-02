"use client";

import { buttonClass } from "@/components/ui/button";

export function PrintButton() {
  return (
    <button type="button" className={buttonClass("ghost", "sm")} onClick={() => window.print()}>
      Descargar PDF / Imprimir
    </button>
  );
}
