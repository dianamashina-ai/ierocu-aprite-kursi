"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** citi ceļi, kuros šis punkts skaitās aktīvs */
  match?: string[];
}

const sectionOf = (href: string) => (href.startsWith("/#") ? href.slice(2) : null);

const isActive = (path: string, item: NavItem, section: string | null = null) => {
  const id = sectionOf(item.href);
  if (id) return path === "/" && section === id;
  return [item.href, ...(item.match ?? [])].some((p) =>
    p === "/" ? path === "/" : path === p || path.startsWith(`${p}/`),
  );
};

/**
 * Sākumlapas sadaļa, kas pašlaik redzama zem galvenes (enkura saitēm “/#…”).
 * Aktīva ir pēdējā sadaļa, kuras augša jau pārsniegusi līniju ~⅓ ekrāna augstumā.
 */
function useActiveSection(ids: string[], enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join(",");
  useEffect(() => {
    if (!enabled || !ids.length) return setActive(null);
    const update = () => {
      const line = window.innerHeight / 3;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > 0) current = id;
      }
      // lapas apakšā — pēdējā sadaļa, ja tā redzama
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        const last = document.getElementById(ids[ids.length - 1]);
        if (last && last.getBoundingClientRect().top < window.innerHeight) current = ids[ids.length - 1];
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("hashchange", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("hashchange", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ids salīdzinām pēc key
  }, [key, enabled]);
  return active;
}

/** Galvenā navigācija: datorā — rinda centrā, telefonā — izvēlne. */
export function SiteNav({
  items,
  signedIn,
  showBuy,
}: {
  items: NavItem[];
  signedIn: boolean;
  showBuy: boolean;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const section = useActiveSection(
    items.map((it) => sectionOf(it.href)).filter((x): x is string => Boolean(x)),
    path === "/",
  );

  const itemCls = (active: boolean) =>
    `inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-[15px] transition-colors hover:bg-accent-soft ${
      active
        ? "font-semibold text-ink"
        : "font-normal text-muted hover:text-ink"
    }`;
  const mobileCls = (active: boolean) =>
    `-mx-2 flex min-h-12 w-[calc(100%+1rem)] items-center rounded-lg px-2 text-left text-base hover:bg-accent-soft ${active ? "font-semibold text-ink" : "font-normal text-muted"}`;
  const onAccount = path === "/konts" || path.startsWith("/konts/");

  return (
    <>
      <nav
        aria-label="Galvenā navigācija"
        className="hidden flex-1 items-center justify-end gap-1 xl:flex"
      >
        <ul className="flex items-center gap-1">
          {items.map((it) => {
            const active = isActive(path, it, section);
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-current={active ? (sectionOf(it.href) ? "location" : "page") : undefined}
                  className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-[15px] transition-colors hover:bg-accent-soft ${
                    active
                      ? "font-semibold text-ink"
                      : "font-normal text-muted hover:text-ink"
                  }`}
                >
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-1">
          {signedIn ? (
            <>
              <Link
                href="/konts"
                aria-current={onAccount ? "page" : undefined}
                className={itemCls(onAccount)}
              >
                Profils
              </Link>
              {showBuy && (
                <Link href="/iegadaties" className="btn-primary ml-2 min-h-11 px-4 text-sm">
                  Pilna piekļuve
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/pieslegties" className="btn-secondary ml-2 min-h-11 px-4 text-sm">
                Pieslēgties
              </Link>
              <Link href="/registreties" className="btn-primary ml-2 min-h-11 gap-2 px-4 text-sm">
                Sākt bez maksas <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </>
          )}
        </div>
      </nav>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="inline-flex size-11 items-center justify-center rounded-xl border border-line xl:hidden"
      >
        {open ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <Menu className="size-5" aria-hidden="true" />
        )}
        <span className="sr-only">
          {open ? "Aizvērt izvēlni" : "Atvērt izvēlni"}
        </span>
      </button>

      {open && (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full z-20 border-b border-line bg-white shadow-lg xl:hidden"
        >
          <nav
            aria-label="Galvenā navigācija"
            className="mx-auto max-w-6xl px-4 py-3"
          >
            <ul className="divide-y divide-line">
              {items.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={isActive(path, it, section) ? (sectionOf(it.href) ? "location" : "page") : undefined}
                    className={mobileCls(isActive(path, it, section))}
                    onClick={() => setOpen(false)}
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
              {signedIn && (
                <>
                  <li>
                    <Link
                      href="/konts"
                      aria-current={onAccount ? "page" : undefined}
                      className={mobileCls(onAccount)}
                    >
                      Profils
                    </Link>
                  </li>
                </>
              )}
            </ul>
            {(showBuy || !signedIn) && (
              <div className="flex flex-wrap gap-2 py-3">
                {showBuy && (
                  <Link href="/iegadaties" className="btn-primary">
                    Pilna piekļuve
                  </Link>
                )}
                {!signedIn && (
                  <>
                    <Link href="/registreties" className="btn-primary gap-2">
                      Sākt bez maksas <ArrowUpRight aria-hidden="true" className="size-4" />
                    </Link>
                    <Link href="/pieslegties" className="btn-secondary">
                      Pieslēgties
                    </Link>
                  </>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
