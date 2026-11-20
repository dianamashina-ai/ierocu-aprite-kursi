import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getExamConfig, getExamHistory } from "@/lib/progress/service";
import { startExamAction } from "@/app/actions/progress";
import { formatDateTime } from "@/lib/format";
import { hasFullAccess } from "@/lib/billing/access";
import { Paywall } from "@/components/billing/paywall";

export const dynamic = "force-dynamic";
export const metadata = { title: "Izmēģinājuma eksāmens" };

export default async function ExamStartPage() {
  const [user, cfg] = await Promise.all([getCurrentUser(), getExamConfig()]);
  const history = user ? await getExamHistory(user.id) : [];
  const access = await hasFullAccess(user?.id);
  const maxWrong = cfg.questionCount - Math.ceil((cfg.questionCount * cfg.passPercent) / 100);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold">Izmēģinājuma eksāmens</h1>
      <p className="mt-2 text-muted">Jautājumi tiek izvēlēti nejauši no visām 10 oficiālajām sadaļām proporcionāli to lielumam.</p>

      <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-line bg-white p-4"><dt className="text-sm text-muted">Jautājumi</dt><dd className="text-2xl font-bold">{cfg.questionCount}</dd></div>
        <div className="rounded-xl border border-line bg-white p-4"><dt className="text-sm text-muted">Laiks</dt><dd className="text-2xl font-bold">{cfg.durationMinutes} min</dd></div>
        <div className="rounded-xl border border-line bg-white p-4"><dt className="text-sm text-muted">Drīkst kļūdīties</dt><dd className="text-2xl font-bold">{maxWrong}</dd></div>
      </dl>
      <ul className="mt-6 list-disc space-y-1 pl-5 text-sm text-muted">
        <li>Eksāmena laikā skaidrojumi netiek rādīti. Pareizās atbildes redzēsi beigās.</li>
        <li>Starp jautājumiem var pārvietoties un atbildes mainīt līdz beigām.</li>
        <li>Kad laiks beidzas, eksāmens tiek pabeigts automātiski. Neatbildētie jautājumi skaitās nepareizi.</li>
        <li>Atbildes tiek saglabātas uzreiz. Ja aizver lapu, vari turpināt no tās pašas vietas.</li>
      </ul>

      <div className="mt-8">
        {!access ? (
          <Paywall title="Izmēģinājuma eksāmens pieejams ar pilnu piekļuvi" />
        ) : user ? (
          <form action={startExamAction}>
            <button type="submit" className="btn-primary">Sākt eksāmenu</button>
          </form>
        ) : (
          <Link href="/pieslegties?next=/eksamens" className="btn-primary">Pieslēdzies, lai sāktu</Link>
        )}
      </div>

      {history.length > 0 && (
        <section className="mt-12" aria-labelledby="hist-h">
          <h2 id="hist-h" className="text-xl font-semibold">Iepriekšējie mēģinājumi</h2>
          <ol className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
            {history.map((e) => (
              <li key={e.id}>
                <Link href={`/eksamens/${e.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent-soft">
                  <span className="text-sm">{formatDateTime(e.finishedAt!)}</span>
                  <span className="tabular-nums">{e.correctCount}/{e.questionIds.length}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${e.passed ? "bg-ok-soft text-ok" : "bg-err-soft text-err"}`}>
                    {e.passed ? "Nokārtots" : "Nav nokārtots"}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
