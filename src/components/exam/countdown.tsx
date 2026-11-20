"use client";

import { useEffect, useState } from "react";

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/** Atlikušais laiks līdz termiņam (mm:ss), atjaunojas katru sekundi. */
export function Countdown({ deadline, className }: { deadline: string; className?: string }) {
  const end = new Date(deadline).getTime();
  const [left, setLeft] = useState(() => end - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(end - Date.now()), 1000);
    return () => clearInterval(t);
  }, [end]);
  return (
    <span className={className} role="timer" aria-label="Atlikušais laiks">
      {fmt(left)}
    </span>
  );
}
