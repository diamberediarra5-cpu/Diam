import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacidad y cookies", alternates: { canonical: "/privacidad" } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad y cookies" updated="2 de octubre de 2026">
      <h2>Responsable</h2>
      <p>
        {site.legalOwner}, NIF {site.legalTaxId}. Contacto: {site.supportEmail}.
      </p>
      <h2>Qué datos tratamos y para qué</h2>
      <ul>
        <li><strong>Datos de tu cuenta</strong> (nombre, email, contraseña cifrada): para darte acceso al servicio. Base legal: contrato.</li>
        <li><strong>Datos de tu negocio y de tus clientes</strong> que introduces en los presupuestos: solo para prestarte el servicio. Actuamos como encargados del tratamiento de los datos de tus clientes; tú eres el responsable.</li>
        <li><strong>Datos de pago</strong>: los gestiona Stripe. Nosotros no vemos ni guardamos los datos de tu tarjeta.</li>
        <li><strong>Uso del servicio</strong> (eventos como «presupuesto creado», sin contenido): para mejorar el producto. Base legal: interés legítimo.</li>
        <li><strong>Mensajes de contacto</strong>: para responderte.</li>
      </ul>
      <h2>Inteligencia artificial</h2>
      <p>
        Cuando usas «Generar partidas con IA», el texto que escribes se envía a nuestro proveedor de IA para generar la propuesta. No incluyas datos personales
        de tus clientes en esa descripción. El proveedor no usa estos datos para entrenar sus modelos según sus condiciones comerciales.
      </p>
      <h2>Encargados del tratamiento</h2>
      <ul>
        <li>Alojamiento y base de datos (proveedor cloud con servidores en la UE).</li>
        <li>Stripe (pagos).</li>
        <li>Resend (emails transaccionales, como recuperar la contraseña).</li>
        <li>Proveedor de IA (solo el texto de la descripción del trabajo).</li>
      </ul>
      <h2>Conservación</h2>
      <p>Mientras tengas cuenta. Si pides la baja, borramos tus datos en 30 días, salvo los que debamos conservar por obligación legal (por ejemplo, facturación).</p>
      <h2>Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a {site.supportEmail}. También puedes
        reclamar ante la Agencia Española de Protección de Datos (aepd.es).
      </p>
      <h2>Cookies</h2>
      <p>
        Solo usamos una cookie técnica imprescindible para mantener tu sesión iniciada. No usamos cookies de publicidad ni de analítica de terceros, por lo que no
        necesitamos pedirte consentimiento.
      </p>
    </LegalPage>
  );
}
