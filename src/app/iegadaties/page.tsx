import Link from "next/link";
import { Check } from "lucide-react";
import { courseIncluded } from "@/lib/billing/included";
import { getCurrentUser } from "@/lib/auth/session";
import { hasFullAccess } from "@/lib/billing/access";
import { activeProviderName, availablePayMethods } from "@/lib/billing/service";
import {
  buyPath,
  isProductCode,
  LESSON_INCLUDES,
  LESSON_SCHEDULING,
  PRODUCTS,
  productByCode,
  splitVat,
  type ProductCode,
} from "@/config/pricing";
import { formatEuro } from "@/lib/format";
import { CheckoutForm } from "@/components/billing/checkout-form";
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

/** Produkti, starp kuriem var izvēlēties pirkuma lapā (testa pirkums — tikai ar tiešu saiti). */
const CHOICES: ProductCode[] = ["course", "lesson", "bundle"];

export default async function BuyPage({ searchParams }: { searchParams: Promise<{ produkts?: string }> }) {
  const sp = await searchParams;
  const code: ProductCode = isProductCode(sp.produkts) ? sp.produkts : "course";
  const product = productByCode(code);
  const self = buyPath(code);
  const [user, course] = await Promise.all([getCurrentUser(), getCourseOverview()]);
  const hasCourse = await hasFullAccess(user?.id);
  // Kursu otrreiz nepērk; nodarbību un testa pirkumu — var.
  const blocked = hasCourse && (code === "course" || code === "bundle");
  const provider = activeProviderName();
  const methods = provider && user && !blocked ? await availablePayMethods() : [];
  const price = formatEuro(product.amountCents);
  const { vatCents } = splitVat(product.amountCents, product.vatRate);

  const included = [
    ...(product.includesCourse ? courseIncluded(course.totals, { questions: 40, minutes: 40 }) : []),
    ...(product.includesLesson ? LESSON_INCLUDES : []),
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold">Iegādāties</h1>

      {code !== "test" && (
        <nav aria-label="Produkts" className="mt-6 grid gap-2 sm:grid-cols-3">
          {CHOICES.map((c) => {
            const p = PRODUCTS[c];
            const active = c === code;
            return (
              <Link
                key={c}
                href={buyPath(c)}
                aria-current={active ? "page" : undefined}
                className={`rounded-xl border-2 px-4 py-3 ${active ? "border-accent bg-accent-soft" : "border-line bg-white hover:border-ink/30"}`}
              >
                <span className="block font-semibold">{p.title}</span>
                <span className="block text-sm text-muted tabular-nums">{formatEuro(p.amountCents)}</span>
              </Link>
            );
          })}
        </nav>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <section aria-labelledby="offer-h" className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 id="offer-h" className="text-xl font-semibold">
            {product.title}
          </h2>
          <p className="mt-2 text-4xl font-semibold text-accent-strong tabular-nums">{price}</p>
          <p className="mt-1 text-sm text-muted">
            t. sk. PVN {product.vatRate} % — {formatEuro(vatCents)}. Vienreizējs maksājums
            {product.includesCourse ? ", bez abonementa" : ""}.
          </p>
          <ul className="mt-5 space-y-2">
            {included.map((x) => (
              <li key={x} className="flex gap-2">
                <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ok" strokeWidth={2.5} />
                <span>{x}</span>
              </li>
            ))}
          </ul>
          {product.includesLesson && <p className="mt-5 text-sm text-muted">{LESSON_SCHEDULING}</p>}
          {code === "course" && <p className="mt-5 text-sm text-muted">1. modulis ir pieejams bez maksas.</p>}
        </section>

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
            ) : !user ? (
              <div className="space-y-4">
                <p>Lai iegādātos, izveido kontu vai pieslēdzies — pirkums tiks piesaistīts tavam kontam.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/registreties?next=${encodeURIComponent(self)}`} className="btn-primary">
                    Izveidot kontu
                  </Link>
                  <Link href={`/pieslegties?next=${encodeURIComponent(self)}`} className="btn-secondary">
                    Pieslēgties
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <CheckoutForm email={user.email} defaultName={user.name} priceLabel={price} product={code} methods={methods} />
                <p className="mt-4 text-xs text-muted">{PROVIDER_NOTE[provider]}</p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
