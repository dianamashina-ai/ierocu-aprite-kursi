import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getContentVersion } from "@/lib/content/queries";
import { SELLER } from "@/config/seller";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Kurss",
    links: [
      { href: "/", label: "Mācību kurss" },
      { href: "/modulis/M1", label: "1. modulis — bez maksas" },
      { href: "/eksamens", label: "Izmēģinājuma eksāmens" },
      { href: "/meklet", label: "Meklēt jautājumu" },
    ],
  },
  {
    title: "Konts",
    links: [
      { href: "/pieslegties", label: "Pieslēgties" },
      { href: "/registreties", label: "Izveidot kontu" },
      { href: "/panelis", label: "Mans progress" },
      { href: "/kludas", label: "Kļūdu labošana" },
      { href: "/parole/aizmirsta", label: "Aizmirsi paroli?" },
    ],
  },
  {
    title: "Pirkums",
    links: [
      { href: "/iegadaties", label: "Pilna piekļuve" },
      { href: "/noteikumi", label: "Lietošanas un pirkšanas noteikumi" },
    ],
  },
];

export async function SiteFooter() {
  const [t, version] = await Promise.all([getTranslations("footer"), getContentVersion()]);
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-white print:hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 lg:grid-cols-4 lg:py-16">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-base font-semibold tracking-normal">{col.title}</h2>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[15px] text-muted transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="col-span-2 lg:col-span-1">
            <h2 className="text-base font-semibold tracking-normal">Piegādātājs</h2>
            <address className="mt-5 space-y-1.5 text-[15px] not-italic text-muted">
              <p>{SELLER.name}</p>
              <p>Reģ. Nr. {SELLER.regNo}</p>
              <p>PVN Nr. {SELLER.vatNo}</p>
              <p>{SELLER.address}</p>
            </address>
          </div>
        </div>

        <div className="border-t border-line py-6">
          <p className="max-w-3xl text-sm text-muted">{t("disclaimer")}</p>
        </div>

        <div className="flex flex-col gap-5 border-t border-line py-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" aria-label="Ieroču atļauja — uz sākumu" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- vektora logotips */}
            <img src="/logo-lpsc-2026.svg" alt="Ieroču atļauja — sadarbībā ar LPSC" width={235} height={40} className="h-9 w-auto" />
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <Link href="/noteikumi" className="hover:text-ink">Noteikumi</Link>
            <span>{t("contentVersion", { version })}</span>
          </div>
          <p className="text-sm text-muted">© {year} {SELLER.name}</p>
        </div>
      </div>
    </footer>
  );
}
