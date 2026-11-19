import Link from "next/link";
import { Crosshair } from "lucide-react";
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
    <header className="relative border-b border-line bg-white/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:h-20 sm:px-6">
        <Link href={user ? "/panelis" : "/"} className="flex items-center gap-2.5">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-accent text-brand">
            <Crosshair className="size-5" strokeWidth={2} />
          </span>
          <span className="text-[17px] font-bold uppercase tracking-[0.12em] text-accent">Ieroču eksāmens</span>
        </Link>
        <SiteNav items={items} signedIn={Boolean(user)} showBuy={Boolean(user) && !access} />
      </div>
    </header>
  );
}
