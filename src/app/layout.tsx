import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NotesOverlay } from "@/components/notes/notes-overlay";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import "@fontsource-variable/figtree";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: { default: t("title"), template: `%s · ${t("title")}` }, description: t("description") };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const admin = isAdmin(await getCurrentUser());
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
          {admin && <NotesOverlay />}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
