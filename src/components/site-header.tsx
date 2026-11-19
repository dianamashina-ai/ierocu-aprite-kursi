import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-lg font-semibold text-accent-strong">
          {t("brand")}
        </Link>
        <nav aria-label={t("main")} className="flex gap-1">
          <Link href="/#moduli" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted hover:bg-accent-soft hover:text-accent-strong">
            {t("modules")}
          </Link>
          <Link href="/meklet" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted hover:bg-accent-soft hover:text-accent-strong">
            {t("search")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
