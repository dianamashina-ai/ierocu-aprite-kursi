"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { FamilyComparison, type CompareLabels } from "@/components/compare/family-comparison";
import type { FamilyQuestionView } from "@/lib/quiz/diff";

type Data = { view: FamilyQuestionView[]; sharedText: string; labels: CompareLabels; heading: string; lead: string };

/** Poga “Salīdzināt līdzīgos” + izbīdāms panelis no labās puses (nepamet treniņu). */
export function FamilyDrawer({ familyId, from, label }: { familyId: number; from: number; label: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const trigger = triggerRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open || data) return;
    let cancelled = false;
    fetch(`/api/saime/${familyId}?no=${from}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Data) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [open, data, familyId, from]);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} className="btn-secondary">
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="family-drawer-h">
          <button type="button" aria-label="Aizvērt" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/40 motion-safe:animate-[fade-in_150ms_ease-out]" />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-white shadow-[-24px_0_60px_-24px_rgba(0,0,0,0.35)] motion-safe:animate-[slide-in-right_200ms_ease-out]">
            <div className="flex items-center justify-between gap-4 border-b border-line bg-white p-4">
              <h2 id="family-drawer-h" className="font-semibold">
                {data?.heading ?? "Līdzīgie jautājumi"}
              </h2>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Aizvērt" className="-mr-2 inline-flex size-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-line hover:text-ink active:bg-line">
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {error ? (
                <p className="text-muted">Neizdevās ielādēt salīdzinājumu. Mēģini vēlreiz.</p>
              ) : !data ? (
                <p className="text-muted">Ielādē…</p>
              ) : (
                <>
                  <p className="mb-6 text-muted">{data.lead}</p>
                  <FamilyComparison view={data.view} sharedText={data.sharedText} from={from} labels={data.labels} compact />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
