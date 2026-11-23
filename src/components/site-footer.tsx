import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SELLER } from "@/config/seller";
import { getCurrentUser } from "@/lib/auth/session";

const COURSE_LINKS = [
  { href: "/#programma", label: "Mācību kurss" },
  { href: "/registreties", label: "Sākt bez maksas" },
  { href: "/iegadaties", label: "Iegādāties" },
];

/** Apakšējā josla — vienāda viesiem un pieslēgtiem lietotājiem. */
function BottomBar({ year }: { year: number }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <nav aria-label="Informācija" className="flex flex-wrap gap-x-5 gap-y-2">
        <Link href="/noteikumi" className="hover:text-ink">
          Noteikumi
        </Link>
        <Link href="/privatums" className="hover:text-ink">
          Privātums
        </Link>
        <Link href="/sikdatnes" className="hover:text-ink">
          Sīkdatnes
        </Link>
        <Link href="/kontakti" className="hover:text-ink">
          Kontakti
        </Link>
      </nav>
      <p>
        © {year} {SELLER.name}
      </p>
    </div>
  );
}

export async function SiteFooter() {
  const [t, user] = await Promise.all([getTranslations("footer"), getCurrentUser()]);
  const year = new Date().getFullYear();

  // Pieslēgtam lietotājam — kompakta kājene: saites, piegādātājs, satura versija
  if (user)
    return (
      <footer className="border-t border-line bg-white print:hidden">
        <BottomBar year={year} />
      </footer>
    );

  return (
    <footer className="border-t border-line bg-white print:hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-10 gap-y-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-16">
        <div>
          <Link href="/" aria-label="Ieroču atļauja — uz sākumu" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element -- vektora logotips */}
            <img
              src="/logo-lpsc-2026.svg"
              alt="Ieroču atļauja — sadarbībā ar LPSC"
              width={235}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">{t("disclaimer")}</p>
        </div>

        <div className="flex flex-col gap-10 sm:flex-row sm:gap-16">
          <nav aria-label="Kurss" className="shrink-0">
            <h2 className="text-base font-semibold tracking-normal">Kurss</h2>
            <ul className="mt-5 space-y-2 text-[15px] leading-relaxed">
              {COURSE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-base font-semibold tracking-normal">Piegādātājs</h2>
            <address className="mt-5 space-y-2 text-[15px] leading-relaxed not-italic text-muted">
              <p>{SELLER.name}</p>
              <p>Reģ. Nr. {SELLER.regNo}</p>
              <p>PVN Nr. {SELLER.vatNo}</p>
              <p>{SELLER.address}</p>
              <p>
                <a href={`mailto:${SELLER.email}`} className="transition-colors hover:text-ink">
                  {SELLER.email}
                </a>
              </p>
            </address>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <BottomBar year={year} />
      </div>
    </footer>
  );
}
