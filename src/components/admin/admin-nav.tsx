"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Pārskats", exact: true },
  { href: "/admin/pasutijumi", label: "Pasūtījumi" },
  { href: "/admin/lietotaji", label: "Lietotāji" },
  { href: "/admin/skaidrojumi", label: "Skaidrojumi" },
  { href: "/labojumi", label: "Dizaina labojumi" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Administrācija" className="-mx-1 flex gap-1 overflow-x-auto">
      {ITEMS.map((it) => {
        const active = it.exact ? path === it.href : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-lg px-4 text-sm ${active ? "bg-accent-soft font-semibold text-ink" : "text-muted hover:bg-accent-soft hover:text-ink"}`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
