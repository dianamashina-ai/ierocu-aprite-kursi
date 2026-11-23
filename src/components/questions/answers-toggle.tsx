"use client";

import { useEffect, useState } from "react";

const KEY = "jautajumi:paslept-atbildes";

/** “Rādīt pareizās atbildes” — paslēpj pareizo atbilžu iezīmēšanu un skaidrojumus (pašpārbaudei). */
export function AnswersToggle({ children }: { children: React.ReactNode }) {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    try {
      setHide(localStorage.getItem(KEY) === "1");
    } catch {}
  }, []);
  const change = (v: boolean) => {
    setHide(v);
    try {
      localStorage.setItem(KEY, v ? "1" : "0");
    } catch {}
  };
  return (
    <div className="group/ans" data-hide={hide}>
      <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm">
        <input type="checkbox" checked={!hide} onChange={(e) => change(!e.target.checked)} className="size-4 accent-accent" />
        Rādīt pareizās atbildes
      </label>
      {children}
    </div>
  );
}
