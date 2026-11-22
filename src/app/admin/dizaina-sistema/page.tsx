import { ArrowRight, Check, LogOut, Lock, Search, TriangleAlert, X } from "lucide-react";
import { AuthField, ErrorText, PasswordRules } from "@/components/auth/forms";
import { OrderStatusBadge, ExplanationBadge } from "@/components/admin/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { ExamAttemptsCard } from "@/components/home/progress-summary";
import { ModuleIcon } from "@/components/module-icon";

export const metadata = { title: "Dizaina sistēma" };

/**
 * Dzīvā dizaina sistēma: šeit redzami īstie vietnes komponenti un krāsas.
 * Labojot klasi komponentā vai globals.css, izmaiņas redzamas gan šeit, gan visā vietnē.
 */

const COLORS: { token: string; hex: string; use: string; dark?: boolean }[] = [
  { token: "ink", hex: "#222222", use: "Pamata teksts, virsraksti, sekundārās pogas apmale", dark: true },
  { token: "muted", hex: "#5C5C5C", use: "Sekundārais teksts, paskaidrojumi, neaktīvi izvēlnes punkti", dark: true },
  { token: "line", hex: "#E3E3E3", use: "Apmales, atdalītāji, lauku rāmji" },
  { token: "surface", hex: "#F8F8F8", use: "Lauku fons, hover fons, izcelti bloki" },
  { token: "white", hex: "#FFFFFF", use: "Lapas fons visur, kartītes" },
  { token: "accent (zīmols)", hex: "#6C3441", use: "Galvenās pogas, fokusa apmale, akcenti, progress", dark: true },
  { token: "accent-strong", hex: "#522630", use: "Galvenās pogas hover, saites", dark: true },
  { token: "accent-soft", hex: "#EFEFEF", use: "Hover fons izvēlnē, burtu apļi atbildēs" },
  { token: "ok", hex: "#1D6B3A", use: "Pareizi, apmaksāts, izpildīts", dark: true },
  { token: "ok-soft", hex: "#E6F2EA", use: "Pareizās atbildes fons, veiksmes paziņojumi" },
  { token: "err", hex: "#C0261A", use: "Nepareizi, kļūdas, atmaksāts", dark: true },
  { token: "err-soft", hex: "#FDE8E5", use: "Kļūdas fons" },
  { token: "warn", hex: "#7A4F00", use: "Brīdinājumi (likuma izmaiņas, testa režīms)", dark: true },
  { token: "warn-soft", hex: "#FBF0D9", use: "Brīdinājuma fons" },
];

function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6 border-t border-line py-10">
      <h2 id={`${id}-h`} className="text-2xl font-semibold tracking-tight">{title}</h2>
      {lead && <p className="mt-2 max-w-2xl text-muted">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Spec({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-b border-line py-4 last:border-0 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
      <p className="text-sm text-muted">{name}</p>
      <div>{children}</div>
    </div>
  );
}

const TOC = [
  ["krasas", "Krāsas"],
  ["tipografija", "Tipogrāfija"],
  ["pogas", "Pogas"],
  ["lauki", "Lauki"],
  ["pazinojumi", "Paziņojumi"],
  ["birkas", "Birkas"],
  ["atbildes", "Atbilžu varianti"],
  ["kartites", "Kartītes"],
  ["navigacija", "Navigācija"],
  ["izmeri", "Izmēri un režģis"],
] as const;

export default function DesignSystemPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Dizaina sistēma</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Šeit ir īstie vietnes komponenti. Ja kaut kas jāmaina, spied <strong>Labot</strong> un atzīmē elementu — izmaiņas tiks
        piemērotas visā vietnē.
      </p>
      <nav aria-label="Saturs" className="mb-8 mt-6 flex flex-wrap gap-2">
        {TOC.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:border-ink hover:text-ink">
            {label}
          </a>
        ))}
      </nav>

      <Section id="krasas" title="Krāsas" lead="Melnbalta gamma ar vienu zīmola krāsu. Statusa krāsas — tikai pareizi/nepareizi/brīdinājumi.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLORS.map((c) => (
            <div key={c.token} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-3">
              <span className="size-14 shrink-0 rounded-xl border border-line" style={{ background: c.hex }} />
              <span className="min-w-0">
                <span className="block font-semibold">{c.token}</span>
                <span className="block font-mono text-xs text-muted">{c.hex}</span>
                <span className="mt-1 block text-xs text-muted">{c.use}</span>
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="tipografija" title="Tipogrāfija" lead="Viens fonts — Figtree. Biezumi: 400 teksts, 600 virsraksti un pogas, 700 akcenta skaitļi.">
        <Spec name="Lapas virsraksts · 48/40 px · 600">
          <p className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">Ceļš līdz ieroču atļaujai</p>
        </Spec>
        <Spec name="Sadaļas virsraksts · 30 px · 600">
          <p className="text-3xl font-semibold tracking-tight">Moduļi</p>
        </Spec>
        <Spec name="Jautājums · 24/20 px · 600">
          <p className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl">Šaujamieroča darbības princips ir šāds</p>
        </Spec>
        <Spec name="Apakšvirsraksts · 20 px · 600">
          <p className="text-xl font-semibold">Ceļš līdz gatavībai</p>
        </Spec>
        <Spec name="Ievadteksts · 18 px · 400 · muted">
          <p className="text-lg leading-relaxed text-muted">Sāc ar pirmo nodarbību — tajā ir viss eksāmenam vajadzīgais.</p>
        </Spec>
        <Spec name="Pamatteksts · 16 px · 400">
          <p className="leading-relaxed">Pielādējot, sagatavojot šaušanai un izlādējot, stobram jābūt pavērstam drošā virzienā.</p>
        </Spec>
        <Spec name="Mazs teksts · 14 px · muted">
          <p className="text-sm text-muted">Apgūts = pēdējā atbilde uz jautājumu bija pareiza.</p>
        </Spec>
        <Spec name="Sīks teksts · 12 px · muted">
          <p className="text-xs text-muted">Turpinot tu piekrīti lietošanas noteikumiem.</p>
        </Spec>
        <Spec name="Virsrakstiņš (eyebrow) · 14 px · 600 · lielie burti">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Sagatavošanās eksāmenam</p>
        </Spec>
        <Spec name="Akcenta skaitlis · 700">
          <p className="text-4xl font-bold tabular-nums text-accent">515</p>
        </Spec>
        <Spec name="Saite teksta vidū">
          <p>
            Sīkāk — <a href="#tipografija" className="font-semibold text-accent-strong underline underline-offset-4">Privātuma politikā</a>.
          </p>
        </Spec>
      </Section>

      <Section id="pogas" title="Pogas" lead="Augstums 48 px, noapaļojums 12 px, teksts 16 px · 600. Lapā — viena galvenā (zīmola krāsā) poga.">
        <Spec name="Galvenā · btn-primary">
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary">Sākt eksāmenu</button>
            <button type="button" className="btn-primary" disabled style={{ opacity: 0.4 }}>Neaktīva</button>
          </div>
        </Spec>
        <Spec name="Sekundārā (plāna pelēka apmale) · btn-secondary">
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-secondary">← Iepriekšējais</button>
            <button type="button" className="btn-secondary" disabled style={{ opacity: 0.4 }}>Neaktīva</button>
          </div>
        </Spec>
        <Spec name="Teksta poga · btn-ghost">
          <button type="button" className="btn-ghost">Pabeigt vēlāk</button>
        </Spec>
        <Spec name="Google (neitrāla)">
          <button
            type="button"
            className="inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-3 rounded-xl border border-line bg-white px-5 font-semibold text-ink transition-colors hover:border-ink hover:bg-surface"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-surface text-xs font-bold">G</span>
            Turpināt ar Google
          </button>
        </Spec>
        <Spec name="Ar ikonu">
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary gap-2">
              Nākamais <ArrowRight aria-hidden="true" className="size-4" />
            </button>
            <button type="button" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-[15px] text-muted hover:bg-accent-soft hover:text-ink">
              Iziet <LogOut aria-hidden="true" className="size-4" />
            </button>
          </div>
        </Spec>
        <Spec name="Ikonas poga">
          <button type="button" aria-label="Aizvērt" className="inline-flex size-10 items-center justify-center rounded-lg text-muted hover:bg-accent-soft hover:text-ink">
            <X aria-hidden="true" className="size-5" />
          </button>
        </Spec>
      </Section>

      <Section id="lauki" title="Lauki" lead="Pelēks fons, plāna apmale. Fokusā — tikai ārējā zīmola apmale (3 px ar atstarpi), pats lauks nemainās.">
        <div className="grid max-w-sm gap-5">
          <AuthField label="E-pasts" type="email" placeholder="vards@piemers.lv" />
          <div>
            <AuthField label="Parole" type="password" />
            <PasswordRules />
          </div>
          <ErrorText>Nepareizs e-pasts vai parole.</ErrorText>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-5 accent-accent" defaultChecked /> Izvēles rūtiņa
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="ds-r" className="size-4 accent-accent" defaultChecked /> Radio poga
          </label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input type="search" placeholder="Meklēt jautājumu vai numuru…" className="block min-h-12 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-base placeholder:text-muted" />
          </div>
        </div>
      </Section>

      <Section id="pazinojumi" title="Paziņojumi">
        <div className="grid max-w-2xl gap-3">
          <p role="status" className="rounded-lg bg-ok-soft px-4 py-3 text-sm text-ok">Saglabāts.</p>
          <p className="rounded-lg bg-err-soft px-4 py-3 text-sm text-err">Atmaksa neizdevās: maksājums nav atrasts.</p>
          <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
            Ieslēgti <strong>testa maksājumi</strong> — īstu maksājumu vēl nav.
          </p>
          <aside className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm leading-relaxed text-ink">
            <p className="flex items-center gap-1.5 font-semibold text-warn">
              <TriangleAlert aria-hidden="true" className="size-4" /> Likuma izmaiņas
            </p>
            <p className="mt-1.5">No 2026. gada 1. decembra atļaujas izsniegs uz nenoteiktu laiku.</p>
          </aside>
        </div>
      </Section>

      <Section id="birkas" title="Birkas" lead="Apaļas, 12 px · 600, mīksts fons + statusa krāsas teksts.">
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status="paid" />
          <OrderStatusBadge status="pending" />
          <OrderStatusBadge status="refunded" />
          <OrderStatusBadge status="paid" provider="manual" />
          <ExplanationBadge status="reviewed" has />
          <ExplanationBadge status="draft" has />
          <ExplanationBadge status="draft" has={false} />
          <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok">Bez maksas</span>
          <span className="inline-flex items-center gap-1 text-sm text-muted">
            <Lock aria-hidden="true" className="size-3.5" /> Pilnajā piekļuvē
          </span>
        </div>
      </Section>

      <Section id="atbildes" title="Atbilžu varianti" lead="Augstums no 56 px, apmale 2 px, burts aplī. Stāvokļi: parasts, izvēlēts, pareizs, nepareizs, neaktīvs.">
        <ul className="grid max-w-xl gap-3">
          {(
            [
              ["Parasts", "border-line bg-white", "bg-accent-soft text-ink", "A"],
              ["Izvēlēts (eksāmens)", "border-accent bg-accent-soft", "bg-accent text-white", "B"],
              ["Pareizs", "border-ok bg-ok-soft", "bg-ok text-white", "C"],
              ["Nepareizs", "border-err bg-err-soft", "bg-err text-white", "D"],
              ["Neaktīvs pēc atbildes", "border-line bg-white opacity-70", "bg-accent-soft text-ink", "E"],
            ] as const
          ).map(([label, box, dot, key]) => (
            <li key={label} className={`flex min-h-14 items-start gap-3 rounded-xl border-2 px-4 py-3.5 ${box}`}>
              <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${dot}`}>{key}</span>
              <span className="flex-1 text-[16px] leading-relaxed">{label}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="kartites" title="Kartītes" lead="Balts fons, apmale line, noapaļojums 16 px. Hover — ēna vai tumšāka apmale.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col rounded-2xl border border-line bg-white p-6">
            <div className="flex items-start justify-between">
              <span className="text-2xl font-bold tabular-nums text-accent-strong">01</span>
              <ModuleIcon moduleId="M1" />
            </div>
            <h3 className="mt-6 text-xl font-semibold leading-snug tracking-tight">Ierocis: uzbūve un darbība</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">Šaujamieroča un munīcijas jēdzieni, veidi, mehānismi.</p>
            <div className="mt-4">
              <ProgressBar percent={40} label="Moduļa progress" />
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-3xl font-bold tabular-nums leading-none">42 %</p>
            <p className="mt-2 text-sm text-muted">jautājumu apgūti</p>
          </div>
          <div className="rounded-2xl border-2 border-accent bg-white p-5">
            <p className="font-semibold">Tev ir nepabeigts eksāmens</p>
            <p className="mt-1 text-sm text-muted">Izcelta kartīte (aicinājums rīkoties)</p>
          </div>
        </div>
        <h3 className="mt-10 font-semibold">Izmēģinājuma eksāmeni — visi stāvokļi</h3>
        <p className="mt-1 text-sm text-muted">Pēdējie 5 mēģinājumi, vecākais pa kreisi. Sākumlapā blakus kopējam progresam.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["Tukšs stāvoklis (no 70 % progresa)", [null, null, null, null, null]],
              ["1 mēģinājums — nav nokārtots", [false, null, null, null, null]],
              ["1 mēģinājums — nokārtots", [true, null, null, null, null]],
              ["Jaukti rezultāti", [true, false, true, true, null]],
              ["Nav, tad 4 nokārtoti", [false, true, true, true, true]],
              ["5 pēc kārtas nokārtoti — gatavs", [true, true, true, true, true]],
            ] as const
          ).map(([label, r]) => (
            <div key={label}>
              <p className="mb-2 text-xs text-muted">{label}</p>
              <ExamAttemptsCard results={[...r]} />
            </div>
          ))}
        </div>
      </Section>

      <Section id="navigacija" title="Navigācija" lead="Izvēlnes punkts: 15 px · 400 · muted; aktīvais — 600 · ink, bez fona; fons tikai hover.">
        <div className="flex flex-wrap items-center gap-1">
          <span className="inline-flex min-h-11 items-center rounded-lg px-3 text-[15px] font-semibold text-ink">Mācību kurss</span>
          <span className="inline-flex min-h-11 items-center rounded-lg px-3 text-[15px] text-muted">Kļūdas</span>
          <span className="inline-flex min-h-11 items-center rounded-lg bg-accent-soft px-3 text-[15px] text-ink">Eksāmens (hover)</span>
          <span className="inline-flex min-h-11 items-center rounded-lg px-3 text-[15px] text-muted">Meklēt</span>
        </div>
        <div className="mt-6 max-w-md">
          <p className="text-sm text-muted">Progresa josla (4 px)</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
            <div className="h-full w-2/5 rounded-full bg-accent" />
          </div>
        </div>
      </Section>

      <Section id="izmeri" title="Izmēri un režģis">
        <Spec name="Satura platums">max 1152 px (max-w-6xl), malas 16 px telefonā / 24 px datorā</Spec>
        <Spec name="Noapaļojumi">8 px — mazi elementi · 12 px — pogas un lauki · 16 px — kartītes · pilns — birkas</Spec>
        <Spec name="Pieskāriena zona">vismaz 44 × 44 px (pogas 48 px)</Spec>
        <Spec name="Fokuss">3 px zīmola krāsas apmale ar 2 px atstarpi — visiem elementiem vienāds</Spec>
        <Spec name="Ikonas">lucide, 16–20 px, līnijas biezums 2</Spec>
        <Spec name="Izkārtojuma robeža">telefons/planšete līdz 1024 px (izvēlne zem pogas līdz 1280 px)</Spec>
        <Spec name="Ikonas piemērs">
          <span className="inline-flex items-center gap-2">
            <Check aria-hidden="true" className="size-5 text-ok" /> <X aria-hidden="true" className="size-5 text-err" />
            <TriangleAlert aria-hidden="true" className="size-5 text-warn" />
          </span>
        </Spec>
      </Section>
    </>
  );
}
