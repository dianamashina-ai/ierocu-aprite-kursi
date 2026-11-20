"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth/client";

export function SignOutButton({ className, icon = true }: { className?: string; icon?: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Iziet
      {icon && <LogOut aria-hidden="true" className="ml-1.5 inline size-4 shrink-0 align-[-3px]" />}
    </button>
  );
}
