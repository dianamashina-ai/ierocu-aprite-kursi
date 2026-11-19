import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getContentVersion } from "@/lib/content/queries";
import { SELLER } from "@/config/seller";

export async function SiteFooter() {
  const [t, version] = await Promise.all([getTranslations("footer"), getContentVersion()]);
  return (
    <footer className="print:hidden border-t border-line bg-white">
      <div className="mx-auto max-w-6xl space-y-2 px-4 py-8 text-sm text-muted sm:px-6">
        <p>{t("disclaimer")}</p>
        <p>
          {SELLER.name}, reģ. Nr. {SELLER.regNo}, {SELLER.address}
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/noteikumi" className="underline underline-offset-2">Lietošanas un pirkšanas noteikumi</Link>
          <span>{t("contentVersion", { version })}</span>
        </p>
      </div>
    </footer>
  );
}
