import Link from "next/link";
import { site } from "@/lib/site";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold text-ink" aria-label={`${site.name}, inicio`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M10 13l2 2 4-4" />
        </svg>
      </span>
      <span className="text-lg tracking-tight">{site.name}</span>
    </Link>
  );
}
