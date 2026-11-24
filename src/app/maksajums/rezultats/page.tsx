import Link from "next/link";
import { Check } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { applyPaymentEvent, getOrderForUser } from "@/lib/billing/service";
import { fetchStripeSessionStatus } from "@/lib/billing/providers/stripe";
import { montonioTokenToPayment } from "@/lib/billing/providers/montonio";
import { formatEuro } from "@/lib/format";
import { buyPath, isProductCode, LESSON_SCHEDULING, productByCode } from "@/config/pricing";
import { AutoRefresh } from "@/components/billing/auto-refresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Maksājuma rezultāts", robots: { index: false } };

export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<{ order?: string; "order-token"?: string }> }) {
  const sp = await searchParams;
  // Montonio pievieno parakstītu order-token; ja “order” parametrs pazudis, pasūtījumu ņemam no tā
  const tokenEv = sp["order-token"] ? montonioTokenToPayment(sp["order-token"]) : null;
  const orderId = sp.order ?? tokenEv?.orderId;
  const user = await requireUser(`/maksajums/rezultats?order=${orderId ?? ""}`);
  if (!orderId) notFound();
  let order = await getOrderForUser(orderId, user.id);
  if (!order) notFound();

  // Ja webhook vēl nav pienācis — pārbaudām statusu tieši (parakstīts token / Stripe API)
  if (order.status === "pending") {
    if (order.provider === "montonio" && tokenEv) {
      if (tokenEv.orderId === order.id) order = (await applyPaymentEvent(tokenEv, "montonio")).order ?? order;
    } else if (order.provider === "stripe" && order.providerRef) {
      const st = await fetchStripeSessionStatus(order.providerRef);
      if (st === "paid") order = (await applyPaymentEvent({ orderId: order.id, status: "paid" }, "stripe")).order ?? order;
    }
  }

  // Montonio atgrieza pircēju, bet maksājums nav apmaksāts (piem., “Atcelt maksājumu”).
  // Pasūtījumu neatceļam — ja banka tomēr apstiprinās, paziņojums atvērs piekļuvi un lapa atjaunosies.
  const code = isProductCode(order.productCode) ? order.productCode : "course";
  const product = productByCode(code);
  const retryHref = buyPath(code);
  const returnedUnpaid = order.status === "pending" && order.provider === "montonio" && tokenEv?.orderId === order.id && tokenEv.status !== "paid";

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-16">
      {order.status === "paid" ? (
        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-ok-soft text-ok">
            <Check className="size-6" strokeWidth={2.5} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold">
            {product.includesCourse ? "Paldies! Pilna piekļuve atvērta" : "Paldies! Praktiskā nodarbība iegādāta"}
          </h1>
          <p className="mt-2 text-muted">Maksājums {formatEuro(order.amountCents)} saņemts.</p>
          <p className="mt-1 text-muted">
            Rēķins {order.invoiceNumber} nosūtīts uz {order.buyer.email}.
          </p>
          {product.includesLesson && <p className="mt-4 rounded-xl bg-surface px-4 py-3">{LESSON_SCHEDULING}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="btn-primary">{product.includesCourse ? "Sākt mācīties" : "Uz sākumu"}</Link>
            <Link href={`/rekins/${order.id}`} className="btn-secondary">Skatīt rēķinu</Link>
          </div>
        </section>
      ) : returnedUnpaid ? (
        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8" aria-live="polite">
          <h1 className="text-2xl font-semibold">Maksājums netika pabeigts</h1>
          <p className="mt-2 text-muted">Nauda netika iekasēta. Vari mēģināt vēlreiz — arī ar citu maksāšanas veidu.</p>
          <p className="mt-2 text-sm text-muted">
            Ja maksājumu tomēr apstiprināji, piekļuve atvērsies automātiski un rēķinu saņemsi e-pastā.
          </p>
          <Link href={retryHref} className="btn-primary mt-6">Mēģināt vēlreiz</Link>
          <AutoRefresh seconds={6} />
        </section>
      ) : order.status === "pending" ? (
        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8" aria-live="polite">
          <h1 className="text-2xl font-semibold">Gaidām apstiprinājumu no bankas…</h1>
          <p className="mt-2 text-muted">Parasti tas aizņem dažas sekundes. Lapa atjaunosies pati.</p>
          <AutoRefresh seconds={4} />
        </section>
      ) : (
        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-semibold">Maksājums netika pabeigts</h1>
          <p className="mt-2 text-muted">Nauda netika iekasēta. Vari mēģināt vēlreiz.</p>
          <Link href={retryHref} className="btn-primary mt-6">Mēģināt vēlreiz</Link>
        </section>
      )}
    </div>
  );
}
