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

  const itemCls = (active: boolean) =>
    `inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-[15px] transition-colors hover:bg-accent-soft ${
      active ? "font-semibold text-ink" : "font-normal text-muted hover:text-ink"
    }`;
  const mobileCls = (active: boolean) =>
    `-mx-2 flex min-h-12 w-[calc(100%+1rem)] items-center rounded-lg px-2 text-left text-base hover:bg-accent-soft ${active ? "font-semibold text-ink" : "font-normal text-muted"}`;
  const onAccount = path === "/konts" || path.startsWith("/konts/");

  return (
    <>
      <nav aria-label="Galvenā navigācija" className="hidden flex-1 justify-end xl:flex">
        <ul className="flex items-center gap-1">
          {items.map((it) => {
            const active = isActive(path, it);
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-[15px] transition-colors hover:bg-accent-soft ${
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

      <div className="hidden items-center gap-1 xl:flex">
        {signedIn ? (
          <>
            <Link href="/konts" aria-current={onAccount ? "page" : undefined} className={itemCls(onAccount)}>Mans konts</Link>
            <SignOutButton className={itemCls(false)} />
            {showBuy && <Link href="/iegadaties" className="btn-primary ml-2 min-h-11 px-4 text-sm">Pilna piekļuve</Link>}
          </>
        ) : (
          <Link href="/pieslegties" className="btn-primary ml-2 min-h-11 px-4 text-sm">Pieslēgties</Link>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="inline-flex size-11 items-center justify-center rounded-xl border border-line xl:hidden"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        <span className="sr-only">{open ? "Aizvērt izvēlni" : "Atvērt izvēlni"}</span>
      </button>

      {open && (
        <div id="mobile-nav" className="absolute inset-x-0 top-full z-20 border-b border-line bg-white shadow-lg xl:hidden">
          <nav aria-label="Galvenā navigācija" className="mx-auto max-w-6xl px-4 py-3">
            <ul className="divide-y divide-line">
              {items.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={isActive(path, it) ? "page" : undefined}
                    className={mobileCls(isActive(path, it))}
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
              {signedIn && (
                <>
                  <li>
                    <Link href="/konts" aria-current={onAccount ? "page" : undefined} className={mobileCls(onAccount)}>Mans konts</Link>
                  </li>
                  <li>
                    <SignOutButton className={mobileCls(false)} />
                  </li>
                </>
              )}
            </ul>
            {(showBuy || !signedIn) && (
              <div className="flex flex-wrap gap-2 py-3">
                {showBuy && <Link href="/iegadaties" className="btn-primary">Pilna piekļuve</Link>}
                {!signedIn && <Link href="/pieslegties" className="btn-primary">Pieslēgties</Link>}
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
