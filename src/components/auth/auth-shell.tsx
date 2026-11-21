import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

const POINTS = [
  "Visi 515 oficiālie eksāmena jautājumi ar skaidrojumiem",
  "37 īsas nodarbības latviešu valodā",
  "Izmēģinājuma eksāmens kā īstajā pārbaudījumā",
  "1. modulis — bez maksas",
];

/**
 * Pieslēgšanās un reģistrācijas lapas: bez vietnes galvenes un kājenes (sk. globals.css .auth-page).
 * Datorā — pa kreisi zīmola panelis, pa labi forma; telefonā — tikai forma ar logotipu.
 */
export function AuthShell({ title, lead, error, children }: { title: string; lead?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="auth-page grid min-h-dvh bg-white lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-surface p-10 xl:p-14 lg:flex">
        <Link href="/" aria-label="Ieroču atļauja — uz sākumu" className="w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element -- vektora logotips */}
          <img src="/logo-lpsc-2026.svg" alt="Ieroču atļauja — sadarbībā ar LPSC" width={235} height={40} className="h-11 w-auto" />
        </Link>

        <div className="max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Sagatavošanās eksāmenam</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-balance">Ceļš līdz ieroču atļaujai sākas šeit</h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                  <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
                </span>
                <span className="text-[17px] leading-snug">{p}</span>
              </li>
            ))}
          </ul>

          {/* dekoratīvs atbildes piemērs */}
          <div aria-hidden="true" className="mt-10 rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_-16px_rgba(34,34,34,0.25)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Jautājums 1 no 40</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
              <div className="h-full w-1/5 rounded-full bg-accent" />
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-ok bg-ok-soft px-3 py-2.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-ok text-xs font-semibold text-white">B</span>
              <span className="h-2 flex-1 rounded-full bg-ok/25" />
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-xl border-2 border-line px-3 py-2.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold">C</span>
              <span className="h-2 w-2/3 rounded-full bg-line" />
            </div>
          </div>
        </div>

        <p className="text-sm text-muted">Kvalifikācijas pārbaudījumu pieņem Valsts policija. Šī ir mācību platforma.</p>
      </aside>

      <div className="flex min-h-dvh flex-col px-4 py-5 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Ieroču atļauja — uz sākumu" className="lg:invisible">
            {/* eslint-disable-next-line @next/next/no-img-element -- vektora logotips */}
            <img src="/logo-lpsc-2026.svg" alt="Ieroču atļauja — sadarbībā ar LPSC" width={235} height={40} className="h-9 w-auto" />
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-muted hover:bg-accent-soft hover:text-ink">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Uz sākumu
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {lead && <p className="mt-2 text-muted">{lead}</p>}
          {error && (
            <p role="alert" className="mt-5 rounded-lg bg-err-soft px-3 py-2 text-sm text-err">
              {error}
            </p>
          )}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
