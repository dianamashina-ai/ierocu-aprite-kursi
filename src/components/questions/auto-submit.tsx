"use client";

import { useEffect, useRef } from "react";

/** Formā: izvēlnes un izvēles rūtiņas maiņa uzreiz iesniedz formu. */
export function AutoSubmit() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const onChange = (e: Event) => {
      const el = e.target as HTMLElement;
      if (el.matches("select, input[type=checkbox]")) form.requestSubmit();
    };
    form.addEventListener("change", onChange);
    return () => form.removeEventListener("change", onChange);
  }, []);
  return <span ref={ref} hidden />;
}
