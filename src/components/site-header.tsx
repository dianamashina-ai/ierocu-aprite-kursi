import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold text-accent-strong">
          {t("brand")}
        </Link>
        <LocaleSwitcher label={t("language")} />
      </div>
    </header>
  );
}
