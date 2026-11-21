import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Pieslēgšanās un reģistrācijas lapas: bez vietnes galvenes un kājenes (sk. globals.css .auth-page).
 * Forma ekrāna centrā, augšā logotips un saite uz sākumu.
 */
export function AuthShell({ title, lead, error, children }: { title: string; lead?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="auth-page min-h-dvh bg-white">
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Ieroču atļauja — uz sākumu">
            {/* eslint-disable-next-line @next/next/no-img-element -- vektora logotips */}
            <img src="/logo-lpsc-2026.svg" alt="Ieroču atļauja — sadarbībā ar LPSC" width={235} height={40} className="h-9 w-auto sm:h-11" />
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-muted hover:bg-accent-soft hover:text-ink">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Uz sākumu
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-center text-3xl font-semibold tracking-tight">{title}</h1>
          {lead && <p className="mt-2 text-center text-muted">{lead}</p>}
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
