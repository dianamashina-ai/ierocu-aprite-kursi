import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { hasFullAccess } from "@/lib/billing/access";
import { isAdmin } from "@/lib/admin";
import { SiteNav, type NavItem } from "./site-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const access = await hasFullAccess(user?.id);
  const items: NavItem[] = [
    { href: "/", label: "Mācīties", match: ["/modulis", "/tema", "/jautajums", "/saime"] },
    ...(user ? [{ href: "/trenins", label: "Trenēties" }] : []),
    { href: "/eksamens", label: "Eksāmens" },
    { href: "/meklet", label: "Meklēt" },
    ...(isAdmin(user) ? [{ href: "/admin", label: "Admin", match: ["/labojumi"] }] : []),
  ];

  return (
    <header className="site-header sticky top-0 z-40 border-b border-line bg-white print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:h-20 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Ieroču atļauja — sadarbībā ar LPSC, uz sākumu">
          {/* eslint-disable-next-line @next/next/no-img-element -- vektora logotips, optimizācija nav vajadzīga */}
          <img src="/logo-lpsc-2026.svg" alt="Ieroču atļauja — sadarbībā ar LPSC" width={235} height={40} className="h-9 w-auto sm:h-11" />
        </Link>
        <SiteNav items={items} signedIn={Boolean(user)} showBuy={Boolean(user) && !access} />
      </div>
    </header>
  );
}
