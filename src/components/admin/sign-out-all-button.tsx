"use client";

import { useState, useTransition } from "react";
import { signOutEverywhereAction } from "@/app/actions/admin";

export function SignOutAllButton({ userId }: { userId: string }) {
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (done) return <p role="status" className="text-sm text-ok">{done}</p>;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => setDone((await signOutEverywhereAction(userId)).message))}
      className="btn-secondary min-h-10 px-4 text-sm disabled:opacity-60"
    >
      Izrakstīt no visām ierīcēm
    </button>
  );
}
