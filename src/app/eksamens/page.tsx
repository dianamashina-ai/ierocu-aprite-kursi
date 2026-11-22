import {
  PageHeader,
  PAGE_CLASS,
  ACTION_CARD_CLASS,
} from "@/components/page-header";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getExamConfig,
  getExamHistory,
  getOpenExam,
} from "@/lib/progress/service";
import { Countdown } from "@/components/exam/countdown";
import { startExamAction } from "@/app/actions/progress";
import { formatDateTime } from "@/lib/format";
import { hasFullAccess } from "@/lib/billing/access";
import { Paywall } from "@/components/billing/paywall";

export const dynamic = "force-dynamic";
export const metadata = { title: "Izmēģinājuma eksāmens" };

export default async function ExamStartPage() {
  const [user, cfg] = await Promise.all([getCurrentUser(), getExamConfig()]);
  const [history, open] = user
    ? await Promise.all([getExamHistory(user.id), getOpenExam(user.id)])
    : [[], null];
  const access = await hasFullAccess(user?.id);
  const maxWrong =
    cfg.questionCount - Math.ceil((cfg.questionCount * cfg.passPercent) / 100);

  return (
    <div className={PAGE_CLASS}>
      <PageHeader
        title="Izmēģinājuma eksāmens"
        lead="Jautājumi tiek izvēlēti nejauši no visām 10 oficiālajām sadaļām proporcionāli to lielumam."
      />

      <div className={ACTION_CARD_CLASS}>
        <dl className="grid grid-cols-3 gap-1 rounded-xl bg-surface p-1 text-center">
          <div className="flex flex-col rounded-lg p-3">
            <dt className="text-xs text-muted sm:text-sm">Jautājumi</dt>
            <dd className="mt-auto whitespace-nowrap pt-1 text-xl font-bold tabular-nums sm:text-2xl">
              {cfg.questionCount}
            </dd>
          </div>
          <div className="flex flex-col rounded-lg p-3">
            <dt className="text-xs text-muted sm:text-sm">Laiks</dt>
            <dd className="mt-auto whitespace-nowrap pt-1 text-xl font-bold tabular-nums sm:text-2xl">
              {cfg.durationMinutes} min
            </dd>
          </div>
          <div className="flex flex-col rounded-lg p-3">
            <dt className="text-xs text-muted sm:text-sm">Drīkst kļūdīties</dt>
            <dd className="mt-auto whitespace-nowrap pt-1 text-xl font-bold tabular-nums sm:text-2xl">{maxWrong}</dd>
          </div>
        </dl>
        <ul className="mt-5 list-disc space-y-1.5 pl-5 text-sm text-muted">
          <li>
            Eksāmena laikā skaidrojumi netiek rādīti. Pareizās atbildes redzēsi
            beigās.
          </li>
          <li>
            Starp jautājumiem var pārvietoties un atbildes mainīt līdz beigām.
          </li>
          <li>
            Kad laiks beidzas, eksāmens tiek pabeigts automātiski. Neatbildētie
            jautājumi skaitās nepareizi.
          </li>
          <li>
            Atbildes tiek saglabātas uzreiz. Ja aizver lapu, vari turpināt no
            tās pašas vietas.
          </li>
        </ul>

        <div className="mt-6">
          {!access ? (
            <Paywall title="Izmēģinājuma eksāmens pieejams ar pilnu piekļuvi" />
          ) : open ? (
            <div className="rounded-xl bg-accent-soft p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">Tev ir nepabeigts eksāmens</p>
                  <p className="mt-1 text-sm text-muted">
                    Atbildēti {open.answered} no {open.total} jautājumiem. Laiks
                    turpina iet arī tad, ja eksāmens nav atvērts.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Atlikušais laiks</p>
                  <Countdown
                    deadline={open.deadline.toISOString()}
                    className="text-2xl font-bold tabular-nums"
                  />
                </div>
              </div>
              <Link
                href={`/eksamens/${open.id}`}
                className="btn-primary mt-4 w-full"
              >
                Turpināt eksāmenu
              </Link>
            </div>
          ) : user ? (
            <form action={startExamAction}>
              <button type="submit" className="btn-primary w-full">
                Sākt eksāmenu
              </button>
            </form>
          ) : (
            <Link
              href="/pieslegties?next=/eksamens"
              className="btn-primary w-full"
            >
              Pieslēdzies, lai sāktu
            </Link>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <section className="mt-10" aria-labelledby="hist-h">
          <h2 id="hist-h" className="text-xl font-semibold">
            Iepriekšējie mēģinājumi
          </h2>
          <ol className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
            {history.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/eksamens/${e.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent-soft"
                >
                  <span className="text-sm">
                    {formatDateTime(e.finishedAt!)}
                  </span>
                  <span className="tabular-nums">
                    {e.correctCount}/{e.questionIds.length}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${e.passed ? "bg-ok-soft text-ok" : "bg-err-soft text-err"}`}
                  >
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
