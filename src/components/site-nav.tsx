"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

export interface NavItem {
  href: string;
  label: string;
  /** citi ceļi, kuros šis punkts skaitās aktīvs */
  match?: string[];
}

const isActive = (path: string, item: NavItem) =>
  [item.href, ...(item.match ?? [])].some((p) => (p === "/" ? path === "/" : path === p || path.startsWith(`${p}/`)));

/** Galvenā navigācija: datorā — rinda centrā, telefonā — izvēlne. */
export function SiteNav({ items, signedIn, showBuy }: { items: NavItem[]; signedIn: boolean; showBuy: boolean }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const account = signedIn ? (
    <Link href="/panelis" className="btn-secondary min-h-11 px-4 text-sm">Mans konts</Link>
  ) : (
    <Link href="/pieslegties" className="btn-primary min-h-11 px-4 text-sm">Pieslēgties</Link>
  );

  return (
    <>
      <nav aria-label="Galvenā navigācija" className="hidden flex-1 justify-end lg:flex">
        <ul className="flex items-center gap-1">
          {items.map((it) => {
            const active = isActive(path, it);
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-lg px-3.5 text-[15px] transition-colors hover:bg-accent-soft ${
                    active ? "font-semibold text-ink" : "font-normal text-muted hover:text-ink"
                  }`}
                >
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden items-center gap-2 lg:flex">
        {showBuy && <Link href="/iegadaties" className="btn-primary min-h-11 px-4 text-sm">Pilna piekļuve</Link>}
        {account}
        {signedIn && <SignOutButton className="inline-flex min-h-11 items-center px-2 text-sm text-muted hover:text-accent-strong" />}
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="inline-flex size-11 items-center justify-center rounded-xl border border-line lg:hidden"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        <span className="sr-only">{open ? "Aizvērt izvēlni" : "Atvērt izvēlni"}</span>
      </button>

      {open && (
        <div id="mobile-nav" className="absolute inset-x-0 top-full z-20 border-b border-line bg-white shadow-lg lg:hidden">
          <nav aria-label="Galvenā navigācija" className="mx-auto max-w-6xl px-4 py-3">
            <ul className="divide-y divide-line">
              {items.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={isActive(path, it) ? "page" : undefined}
                    className={`-mx-2 flex min-h-12 items-center rounded-lg px-2 text-base hover:bg-accent-soft ${isActive(path, it) ? "font-semibold text-ink" : "font-normal text-muted"}`}
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 py-3">
              {showBuy && <Link href="/iegadaties" className="btn-primary">Pilna piekļuve</Link>}
              {signedIn ? <Link href="/panelis" className="btn-secondary">Mans konts</Link> : <Link href="/pieslegties" className="btn-primary">Pieslēgties</Link>}
              {signedIn && <SignOutButton className="btn-ghost" />}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
