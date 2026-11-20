import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { hasFullAccess } from "@/lib/billing/access";
import { activeProviderName } from "@/lib/billing/service";
import { COURSE_PRODUCT, splitVat } from "@/config/pricing";
import { formatEuro } from "@/lib/format";
import { CheckoutForm } from "@/components/billing/checkout-form";
import { getCourseOverview } from "@/lib/content/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pilna piekļuve kursam", description: "Visi moduļi, nodarbības, 515 jautājumi ar skaidrojumiem un izmēģinājuma eksāmens." };

const PROVIDER_NOTE: Record<string, string> = {
  stripe: "Maksājums ar karti caur Stripe.",
  montonio: "Maksājums caur internetbanku (Montonio).",
  dev: "Testa režīms: īsta nauda netiek iekasēta.",
};

export default async function BuyPage() {
  const [user, course] = await Promise.all([getCurrentUser(), getCourseOverview()]);
  const access = await hasFullAccess(user?.id);
  const provider = activeProviderName();
  const price = formatEuro(COURSE_PRODUCT.amountCents);
  const { vatCents } = splitVat(COURSE_PRODUCT.amountCents, COURSE_PRODUCT.vatRate);

  const included = [
    `Visi ${course.totals.modules} moduļi un ${course.totals.topics} īsas nodarbības`,
    `Visi ${course.totals.questions} oficiālie jautājumi ar skaidrojumiem un atsaucēm uz likumu`,
    "Neierobežoti izmēģinājuma eksāmeni (40 jautājumi, 40 minūtes)",
    "Kļūdu atkārtošana pēc 1, 3 un 7 dienām",
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold">Pilna piekļuve kursam</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <section aria-labelledby="offer-h" className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 id="offer-h" className="sr-only">Piedāvājums</h2>
          <p className="text-4xl font-semibold text-accent-strong">{price}</p>
          <p className="mt-1 text-sm text-muted">
            t. sk. PVN {COURSE_PRODUCT.vatRate} % — {formatEuro(vatCents)}. Vienreizējs maksājums, bez abonementa.
          </p>
          <ul className="mt-5 space-y-2">
            {included.map((x) => (
              <li key={x} className="flex gap-2">
                <span aria-hidden="true" className="text-ok">✓</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-muted">1. modulis ir pieejams bez maksas.</p>
        </section>

        <section aria-labelledby="pay-h" className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 id="pay-h" className="text-xl font-semibold">Apmaksa</h2>
          <div className="mt-4">
            {access ? (
              <div className="space-y-4">
                <p className="rounded-lg bg-ok-soft px-3 py-2 text-ok">Tev jau ir pilna piekļuve kursam.</p>
                <Link href="/panelis" className="btn-primary">Uz paneli</Link>
              </div>
            ) : !provider ? (
              <p className="text-muted">Tiešsaistes maksājumi tiks atvērti drīzumā.</p>
            ) : !user ? (
              <div className="space-y-4">
                <p>Lai iegādātos kursu, izveido kontu vai pieslēdzies — piekļuve tiks piesaistīta tavam kontam.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/registreties?next=/iegadaties" className="btn-primary">Izveidot kontu</Link>
                  <Link href="/pieslegties?next=/iegadaties" className="btn-secondary">Pieslēgties</Link>
                </div>
              </div>
            ) : (
              <>
                <CheckoutForm email={user.email} defaultName={user.name} priceLabel={price} />
                <p className="mt-4 text-xs text-muted">{PROVIDER_NOTE[provider]}</p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
