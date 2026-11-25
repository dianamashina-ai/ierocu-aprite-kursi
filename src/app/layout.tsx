import type { Metadata } from "next";
import { hasFullAccess } from "@/lib/billing/access";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NotesOverlay } from "@/components/notes/notes-overlay";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import "@fontsource-variable/figtree";
import "./globals.css";
import { indexingAllowed } from "@/lib/site/indexing";
import { siteUrl } from "@/lib/site/url";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: t("title"), template: `%s · ${t("title")}` },
    description: t("description"),
    metadataBase: new URL(siteUrl()),
    applicationName: t("title"),
    openGraph: { type: "website", locale: "lv_LV", siteName: "Ieroču atļauja", title: t("title"), description: t("description") },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
    // līdz palaišanai vietne netiek indeksēta (SITE_INDEXING=1 to ieslēdz)
    ...(indexingAllowed() ? {} : { robots: { index: false, follow: false } }),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const admin = isAdmin(user);
  const viewFull = admin && user ? await hasFullAccess(user.id) : false;
  return (
    <html lang="lv">
      <body className="relative flex min-h-dvh flex-col antialiased">
        <NextIntlClientProvider>
          <a href="#saturs" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
            Pāriet uz saturu
          </a>
          <SiteHeader />
          <main id="saturs" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          {admin && <NotesOverlay viewFull={viewFull} />}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
