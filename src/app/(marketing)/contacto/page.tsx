import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/contact-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: "¿Dudas sobre Presupuéstalo? Escríbenos y te respondemos en menos de 24 horas laborables.",
  alternates: { canonical: "/contacto" },
};

export default function ContactPage() {
  return (
    <section className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Hablemos</h1>
        <p className="mt-4 text-slate-600">
          ¿Tienes dudas, quieres una función o algo no funciona como esperabas? Escríbenos. Respondemos personas, en español y en menos de 24 h laborables.
        </p>
        <p className="mt-6 text-sm text-muted">
          También por email:{" "}
          <a href={`mailto:${site.supportEmail}`} className="font-medium text-brand-700 underline">
            {site.supportEmail}
          </a>
        </p>
      </div>
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <ContactForm />
      </div>
    </section>
  );
}
