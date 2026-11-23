import Link from "next/link";
import { courseIncluded } from "@/lib/billing/included";
import { getCurrentUser } from "@/lib/auth/session";
import { isGoogleEnabled } from "@/lib/auth";
import { hasFullAccess } from "@/lib/billing/access";
import { activeProviderName, availablePayMethods } from "@/lib/billing/service";
import {
  buyPath,
  isPurchasable,
  PRODUCTS,
  PURCHASABLE,
  productByCode,
  type ProductCode,
} from "@/config/pricing";
import { formatEuro } from "@/lib/format";
import { CheckoutForm } from "@/components/billing/checkout-form";
import { ProductCard } from "@/components/billing/product-card";
import { getCourseOverview } from "@/lib/content/queries";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Iegādāties",
  description: "Mācību kurss, praktiskā nodarbība šautuvē ar sertificētu instruktoru vai abi kopā.",
};

const PROVIDER_NOTE: Record<string, string> = {
  stripe: "Maksājums ar karti caur Stripe.",
  montonio: "Maksājumus apstrādā Montonio.",
  dev: "Testa režīms: īsta nauda netiek iekasēta.",
};

export default async function BuyPage({ searchParams }: { searchParams: Promise<{ produkts?: string }> }) {
  const sp = await searchParams;
  const code: ProductCode = isPurchasable(sp.produkts) ? sp.produkts : "course";
  const product = productByCode(code);
  const self = buyPath(code);
  const [user, course] = await Promise.all([getCurrentUser(), getCourseOverview()]);
  const hasCourse = await hasFullAccess(user?.id);
  // Kursu otrreiz nepērk; nodarbību — var.
  const blocked = hasCourse && (code === "course" || code === "bundle");
  const provider = activeProviderName();
  const methods = provider && !blocked ? await availablePayMethods() : [];
  const price = formatEuro(product.amountCents);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold">Iegādāties</h1>

      <nav aria-label="Produkts" className="mt-6 grid gap-2 sm:grid-cols-3">
          {PURCHASABLE.map((c) => {
            const p = PRODUCTS[c];
            const active = c === code;
            return (
              <Link
                key={c}
                href={buyPath(c)}
                aria-current={active ? "page" : undefined}
                className={`rounded-xl border-2 px-4 py-3 bg-white ${active ? "border-accent" : "border-line hover:border-ink/30"}`}
              >
                <span className="block font-semibold">{p.title}</span>
                <span className="block text-sm text-muted tabular-nums">{formatEuro(p.amountCents)}</span>
              </Link>
            );
          })}
        </nav>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <ProductCard code={code} courseItems={courseIncluded(course.totals, { questions: 40, minutes: 40 })} showVat gray className="self-start" />

        <section aria-labelledby="pay-h" className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 id="pay-h" className="text-xl font-semibold">
            Apmaksa
          </h2>
          <div className="mt-4">
            {blocked ? (
              <div className="space-y-4">
                <p className="rounded-lg bg-ok-soft px-3 py-2 text-ok">Tev jau ir pilna piekļuve kursam.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href={buyPath("lesson")} className="btn-primary">
                    Iegādāties praktisko nodarbību
                  </Link>
                  <Link href="/" className="btn-secondary">
                    Turpināt mācīties
                  </Link>
                </div>
              </div>
            ) : !provider ? (
              <p className="text-muted">Tiešsaistes maksājumi tiks atvērti drīzumā.</p>
            ) : (
              <>
                <CheckoutForm
                  guest={!user}
                  google={isGoogleEnabled}
                  returnTo={self}
                  email={user?.email ?? ""}
                  defaultName={user?.name ?? ""}
                  priceLabel={price}
                  product={code}
                  methods={methods}
                />
                <p className="mt-4 text-xs text-muted">{PROVIDER_NOTE[provider]}</p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
