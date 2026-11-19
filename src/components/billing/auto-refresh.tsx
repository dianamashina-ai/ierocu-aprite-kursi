"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Atjauno servera komponenti ik pēc N sekundēm (maks. 2 minūtes). */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      if (++n * seconds > 120) return clearInterval(id);
      router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
