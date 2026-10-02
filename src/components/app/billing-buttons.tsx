"use client";

import { useState } from "react";
import { openPortalAction, startCheckoutAction } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";

export function UpgradeButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      {error && <Alert>{error}</Alert>}
      <Button
        size="lg"
        className="w-full"
        loading={loading}
        disabled={disabled}
        onClick={async () => {
          setError("");
          setLoading(true);
          const res = await startCheckoutAction();
          if (!res.ok) {
            setLoading(false);
            return setError(res.error);
          }
          window.location.href = res.data.url;
        }}
      >
        Pasar a Pro por 9,90 €/mes
      </Button>
    </div>
  );
}

export function PortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      {error && <Alert>{error}</Alert>}
      <Button
        variant="secondary"
        loading={loading}
        onClick={async () => {
          setError("");
          setLoading(true);
          const res = await openPortalAction();
          if (!res.ok) {
            setLoading(false);
            return setError(res.error);
          }
          window.location.href = res.data.url;
        }}
      >
        Gestionar suscripción, facturas o cancelar
      </Button>
    </div>
  );
}
