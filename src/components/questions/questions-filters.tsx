"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModulePicker, type PickerModule } from "@/components/training/module-picker";

/** “Jautājumi” filtri: moduļi (tas pats saraksts kā treniņā) un “tikai manas kļūdas”. Maiņa uzreiz atjauno sarakstu. */
export function QuestionsFilters({
  modules,
  initial,
  onlyWrong,
  query,
  signedIn,
}: {
  modules: PickerModule[];
  initial: string[];
  onlyWrong: boolean;
  query: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial));
  const [wrong, setWrong] = useState(onlyWrong);

  const go = (sel: Set<string>, w: boolean) => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    const all = sel.size === modules.length;
    p.set("moduli", all ? "visi" : sel.size ? modules.filter((m) => sel.has(m.id)).map((m) => m.id).join(",") : "nav");
    if (w) p.set("kludas", "1");
    router.replace(`/jautajumi?${p}`, { scroll: false });
  };

  return (
    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="sm:w-96">
        <ModulePicker
          id="jq-moduli"
          tone="white"
          modules={modules}
          selected={selected}
          onChange={(next) => {
            setSelected(next);
            go(next, wrong);
          }}
        />
      </div>
      {signedIn && (
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={wrong}
            onChange={(e) => {
              setWrong(e.target.checked);
              go(selected, e.target.checked);
            }}
            className="size-5 shrink-0 accent-accent"
          />
          <span className="font-semibold">Tikai manas kļūdas</span>
        </label>
      )}
    </div>
  );
}
