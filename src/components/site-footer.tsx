import { getTranslations } from "next-intl/server";
import { getContentVersion } from "@/lib/content/queries";

export async function SiteFooter() {
  const [t, version] = await Promise.all([getTranslations("footer"), getContentVersion()]);
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-5xl space-y-2 px-4 py-6 text-sm text-muted">
        <p>{t("disclaimer")}</p>
        <p>{t("contentVersion", { version })}</p>
      </div>
    </footer>
  );
}
