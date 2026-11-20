import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { hasFullAccess } from "@/lib/billing/access";
import { SiteNav, type NavItem } from "./site-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const access = await hasFullAccess(user?.id);
  const items: NavItem[] = [
    ...(user ? [{ href: "/panelis", label: "Mans progress" }] : []),
    { href: "/", label: "Mācību kurss", match: ["/modulis", "/tema", "/jautajums", "/saime"] },
    ...(user ? [{ href: "/kludas", label: "Kļūdas" }] : []),
    { href: "/skaitli", label: "Skaitļi" },
    { href: "/eksamens", label: "Eksāmens" },
    { href: "/meklet", label: "Meklēt" },
  ];

  return (
    <header className="relative border-b border-line bg-white print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:h-20 sm:px-6">
        <Link href={user ? "/panelis" : "/"} className="flex shrink-0 items-center" aria-label="Ieroču atļauja — sadarbībā ar LPSC, uz sākumu">
          {/* eslint-disable-next-line @next/next/no-img-element -- vektora logotips, optimizācija nav vajadzīga */}
          <img src="/logo.svg" alt="Ieroču atļauja — sadarbībā ar LPSC" width={236} height={41} className="h-9 w-auto sm:h-11" />
        </Link>
        <SiteNav items={items} signedIn={Boolean(user)} showBuy={Boolean(user) && !access} />
      </div>
    </header>
  );
}
