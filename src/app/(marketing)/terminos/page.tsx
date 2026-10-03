import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Términos y condiciones", alternates: { canonical: "/terminos" } };

export default function TermsPage() {
  return (
    <LegalPage title="Términos y condiciones" updated="2 de octubre de 2026">
      <p>
        Estas condiciones regulan el uso de {site.name} ({site.url}), servicio prestado por {site.legalOwner}, con NIF {site.legalTaxId} (en adelante,
        «nosotros»). Al crear una cuenta aceptas estas condiciones.
      </p>
      <h2>1. Qué ofrecemos</h2>
      <p>
        {site.name} es una herramienta online para crear, guardar y compartir presupuestos. Los presupuestos los redactas tú: las sugerencias generadas con
        inteligencia artificial son orientativas y debes revisarlas antes de enviarlas. Tú eres responsable del contenido, los precios y los impuestos que
        indiques en tus presupuestos.
      </p>
      <h2>2. Cuenta</h2>
      <ul>
        <li>Debes ser mayor de edad y usar el servicio para tu actividad profesional.</li>
        <li>Mantén tu contraseña en secreto. Eres responsable de la actividad de tu cuenta.</li>
        <li>No puedes usar el servicio para fines ilícitos, enviar spam ni intentar acceder a datos de otros usuarios.</li>
      </ul>
      <h2>3. Planes y pagos</h2>
      <ul>
        <li>El plan Gratis tiene los límites indicados en la página de precios.</li>
        <li>El plan Pro cuesta 9,90 € al mes, IVA incluido, se cobra por adelantado mediante Stripe y se renueva automáticamente cada mes.</li>
        <li>Puedes cancelar en cualquier momento desde tu panel. Mantendrás Pro hasta el final del periodo pagado; no se hacen reembolsos de periodos parciales salvo obligación legal.</li>
        <li>Podemos cambiar los precios avisando con al menos 30 días de antelación.</li>
      </ul>
      <h2>4. Disponibilidad</h2>
      <p>
        Trabajamos para que el servicio esté siempre disponible, pero no podemos garantizar que funcione sin interrupciones. Te recomendamos guardar en PDF los
        presupuestos importantes.
      </p>
      <h2>5. Responsabilidad</h2>
      <p>
        Dentro de lo permitido por la ley, nuestra responsabilidad total frente a ti se limita al importe que nos hayas pagado en los últimos 12 meses. No somos
        responsables de las relaciones comerciales entre tú y tus clientes.
      </p>
      <h2>6. Baja</h2>
      <p>Puedes pedir la baja y el borrado de tus datos en cualquier momento escribiendo a {site.supportEmail}.</p>
      <h2>7. Ley aplicable</h2>
      <p>Estas condiciones se rigen por la ley española. Si eres consumidor, se aplicarán los tribunales de tu domicilio.</p>
    </LegalPage>
  );
}
