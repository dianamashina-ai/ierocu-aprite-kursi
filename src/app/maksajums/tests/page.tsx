import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { activeProviderName, getOrderForUser } from "@/lib/billing/service";
import { testPaymentAction } from "@/app/actions/billing";
import { formatEuro } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Testa maksājums", robots: { index: false } };

/** Imitē maksājumu sistēmas lapu, kamēr nav pieslēgts Stripe vai Montonio. */
export default async function TestPaymentPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId } = await searchParams;
  const user = await requireUser(`/maksajums/tests?order=${orderId ?? ""}`);
  if (activeProviderName() !== "dev" || !orderId) notFound();
  const order = await getOrderForUser(orderId, user.id);
  if (!order || order.provider !== "dev") notFound();

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <section className="rounded-2xl border-2 border-dashed border-warn bg-white p-6">
        <p className="w-fit rounded-full bg-warn-soft px-3 py-1 text-xs font-semibold text-warn">TESTA REŽĪMS — īsta nauda netiek iekasēta</p>
        <h1 className="mt-4 text-2xl font-semibold">Maksājums {formatEuro(order.amountCents)}</h1>
        <p className="mt-2 text-sm text-muted">{order.product}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={testPaymentAction.bind(null, order.id, "paid")}>
            <button type="submit" className="btn-primary">Apmaksāt (tests)</button>
          </form>
          <form action={testPaymentAction.bind(null, order.id, "canceled")}>
            <button type="submit" className="btn-secondary">Atcelt</button>
          </form>
        </div>
      </section>
    </div>
  );
}
