import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/precios`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site.url}/registro`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${site.url}/contacto`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${site.url}/terminos`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
