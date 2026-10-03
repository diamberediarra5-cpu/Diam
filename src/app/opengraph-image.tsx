import { ImageResponse } from "next/og";

export const alt = "Presupuéstalo — Presupuestos profesionales en 2 minutos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#f0fdfa,#ffffff)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: "#0f766e", display: "flex" }} />
          <div style={{ fontSize: 48, fontWeight: 800, color: "#0f172a" }}>Presupuéstalo</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 72, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>Deja de hacer presupuestos por la noche.</div>
        <div style={{ marginTop: 28, fontSize: 34, color: "#475569" }}>Presupuestos profesionales en 2 minutos, desde el móvil. Tu cliente los acepta online.</div>
      </div>
    ),
    size,
  );
}
