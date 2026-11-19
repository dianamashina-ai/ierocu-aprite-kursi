import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { applyPaymentEvent, getOrderForUser } from "@/lib/billing/service";
import { fetchStripeSessionStatus } from "@/lib/billing/providers/stripe";
import { montonioTokenToPayment } from "@/lib/billing/providers/montonio";
import { formatEuro } from "@/lib/format";
import { AutoRefresh } from "@/components/billing/auto-refresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Maksājuma rezultāts", robots: { index: false } };

export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<{ order?: string; "order-token"?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser(`/maksajums/rezultats?order=${sp.order ?? ""}`);
  if (!sp.order) notFound();
  let order = await getOrderForUser(sp.order, user.id);
  if (!order) notFound();

  // Ja webhook vēl nav pienācis — pārbaudām statusu tieši (parakstīts token / Stripe API)
  if (order.status === "pending") {
    if (order.provider === "montonio" && sp["order-token"]) {
      const ev = montonioTokenToPayment(sp["order-token"]);
      if (ev && ev.orderId === order.id) order = (await applyPaymentEvent(ev, "montonio")).order ?? order;
    } else if (order.provider === "stripe" && order.providerRef) {
      const st = await fetchStripeSessionStatus(order.providerRef);
      if (st === "paid") order = (await applyPaymentEvent({ orderId: order.id, status: "paid" }, "stripe")).order ?? order;
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-16">
      {order.status === "paid" ? (
        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <p className="text-4xl" aria-hidden="true">🎯</p>
          <h1 className="mt-2 text-2xl font-semibold">Paldies! Pilna piekļuve atvērta</h1>
          <p className="mt-2 text-muted">
            Maksājums {formatEuro(order.amountCents)} saņemts. Rēķins {order.invoiceNumber} nosūtīts uz {order.buyer.email}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/panelis" className="btn-primary">Sākt mācīties</Link>
            <Link href={`/rekins/${order.id}`} className="btn-secondary">Skatīt rēķinu</Link>
          </div>
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
          <Link href="/iegadaties" className="btn-primary mt-6">Mēģināt vēlreiz</Link>
        </section>
      )}
    </div>
  );
}
