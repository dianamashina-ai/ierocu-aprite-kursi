"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { GrantAccessForm } from "@/components/admin/grant-access-form";

/** Lietotāju saraksta rīki: meklēšana, “Pievienot lietotāju”, filtrs “tikai koplietotie”. */
export function UsersToolbar({ q, onlyShared, threshold }: { q: string; onlyShared: boolean; threshold: number }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const go = (nextQ: string, shared: boolean) => {
    const p = new URLSearchParams();
    if (nextQ) p.set("q", nextQ);
    if (shared) p.set("aizdomas", "1");
    router.push(`/admin/lietotaji${p.size ? `?${p}` : ""}`);
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Lietotāji</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <form
            className="flex gap-2"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              go(String(new FormData(e.currentTarget).get("q") ?? "").trim(), onlyShared);
            }}
          >
            <label htmlFor="users-q" className="sr-only">Meklēt lietotāju</label>
            <input
              id="users-q"
              name="q"
              defaultValue={q}
              placeholder="E-pasts vai vārds"
              className="min-h-11 w-full rounded-lg border border-line bg-white px-3 text-sm sm:w-72"
            />
            <button className="btn-secondary min-h-11 px-4 text-sm">Meklēt</button>
          </form>
          <button type="button" onClick={() => setAdding(true)} className="btn-primary min-h-11 gap-2 px-4 text-sm">
            <UserPlus aria-hidden="true" className="size-4" /> Pievienot lietotāju
          </button>
        </div>
      </div>

      <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-sm">
        <input key={String(onlyShared)} type="checkbox" defaultChecked={onlyShared} onChange={(e) => go(q, e.target.checked)} className="size-4 accent-accent" />
        Tikai iespējami koplietotie
        <span className="text-muted">(vairāk par {threshold} ierīcēm 30 dienās)</span>
      </label>

      {adding && (
        <div className="mt-6">
          <GrantAccessForm defaultOpen onClose={() => setAdding(false)} />
        </div>
      )}
    </>
  );
}
