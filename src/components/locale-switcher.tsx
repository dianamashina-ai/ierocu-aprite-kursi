"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher({ label }: { label: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav aria-label={label} className="flex gap-1">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          aria-current={l === locale ? "true" : undefined}
          className={`min-h-11 min-w-11 rounded-md px-3 text-sm font-medium uppercase ${
            l === locale ? "bg-accent text-white" : "text-muted hover:bg-accent-soft"
          }`}
        >
          {l}
        </button>
      ))}
    </nav>
  );
}
