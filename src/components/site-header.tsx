import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import { SignOutButton } from "./sign-out-button";

const item =
  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted hover:bg-accent-soft hover:text-accent-strong";

export async function SiteHeader() {
  const [t, user] = await Promise.all([getTranslations("nav"), getCurrentUser()]);
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:h-16 sm:py-0">
        <Link href={user ? "/panelis" : "/"} className="py-2 text-lg font-semibold text-accent-strong">
          {t("brand")}
        </Link>
        <nav aria-label={t("main")} className="-mx-2 flex flex-wrap gap-0.5">
          {user ? (
            <>
              <Link href="/panelis" className={item}>Panelis</Link>
              <Link href="/#moduli" className={item}>{t("modules")}</Link>
              <Link href="/kludas" className={item}>Kļūdas</Link>
              <Link href="/eksamens" className={item}>Eksāmens</Link>
              <Link href="/skaitli" className={item}>Skaitļi</Link>
              <Link href="/meklet" className={item}>{t("search")}</Link>
              <SignOutButton className={item} />
            </>
          ) : (
            <>
              <Link href="/#moduli" className={item}>{t("modules")}</Link>
              <Link href="/skaitli" className={item}>Skaitļi</Link>
              <Link href="/meklet" className={item}>{t("search")}</Link>
              <Link href="/pieslegties" className={`${item} text-accent-strong`}>Pieslēgties</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
