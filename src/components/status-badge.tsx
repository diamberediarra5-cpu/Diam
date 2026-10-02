import { cn } from "@/lib/cn";

export const STATUS_LABEL = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
} as const;

const tones = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

export function StatusBadge({ status, viewed }: { status: keyof typeof STATUS_LABEL; viewed?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[status])}>
      {STATUS_LABEL[status]}
      {status === "SENT" && viewed && <span className="font-normal">· visto</span>}
    </span>
  );
}
