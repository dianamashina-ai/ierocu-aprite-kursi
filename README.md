# Ieroču aprites kursi

Mācību platforma sagatavošanai Valsts policijas kvalifikācijas pārbaudījumam
«par ieroču un munīcijas aprites kārtību un prasmēm rīkoties ar ieroci».

> Platforma ir sagatavošanās rīks, nevis oficiālais eksāmens, un nav saistīta ar Valsts policiju.

## Tehnoloģijas

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · next-intl (tikai latviešu, teksti `messages/lv.json`) ·
PostgreSQL (lokāli vai Supabase) + Drizzle ORM · better-auth (konti) · Vitest · Playwright

## Lokālā palaišana

Vajag Node.js 22 un PostgreSQL 15+ (vietējo vai `supabase start`).

```bash
npm install
cp .env.example .env         # skriptiem (seed, migrācijas, testi)
cp .env.example .env.local   # Next.js
# izveido datubāzes, piem.:
#   createuser -P app && createdb -O app ierocu && createdb -O app ierocu_test
# .env: iestati BETTER_AUTH_SECRET (openssl rand -base64 32)
npm run db:setup             # migrācijas + sēklošana no data/questions.json
npm run dev                  # http://localhost:3000
```

## Skripti

| Komanda | Ko dara |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | Vitest: satura integritāte + DB sēklošana (ja iestatīts `TEST_DATABASE_URL`) |
| `npm run test:e2e` | Playwright (mobilais + dators); vispirms `npm run build` |
| `npm run typecheck`, `npm run lint` | TS un ESLint |
| `npm run db:generate` | jauna migrācija pēc `src/db/schema.ts` izmaiņām |
| `npm run db:migrate` | piemēro migrācijas |
| `npm run db:seed` | ievieto trūkstošo saturu; **esošos jautājumus nepārraksta** |
| `npm run db:seed -- --reset` | pārraksta jautājumu tekstus/variantus/pareizo atbildi no faila (skaidrojumi un karogi saglabājas) |

## Saturs

- `data/questions.json` — 515 oficiālie jautājumi (VP 2026, PDF 2026-03-01), sadalīti 9 moduļos un 37 tēmās. **Netiek rediģēts ar roku.**
- `data/corrections.json` — dokumentēti labojumi, kas piemēroti ielādes laikā (pārbaudīti pret PDF):
  - **Q87, Q243, Q313** — PDF variantiem iespiesti burti `a, b, c, a`. Q243 pareizā atbilde ir 4. variants («visas atbildes ir pareizas»), nevis 1.
  - **Q468** — PDF burti `e, f, g, h`; automātiskā nolasīšana bija apvienojusi f–h vienā variantā. Sadalīts 4 variantos, pareizs «visas atbildes ir pareizas».
- Variantu burti datubāzē vienmēr normalizēti `a, b, c…`; PDF iespiestais burts glabājas `question_options.printed_label`.
- `questions.id` = numurs PDF (1–515) — pastāvīgs, uz to atsaucas skolēnu progress.
- Saimes (`questions.family_id`) — jautājumi ar vienādu formulējumu; id = mazākais numurs saimē. 83 saimes, 240 jautājumi.

## Variantu jaukšana (`src/lib/quiz/shuffle.ts`)

- Parastie varianti tiek sajaukti un burti piešķirti no jauna (a, b, c…).
- Kombinācijas («a un b variants», «visas atbildes ir pareizas», «neviena atbilde…») vienmēr paliek beigās;
  burti to tekstā tiek pārrakstīti atbilstoši jaunajai secībai («a un c» → piem. «b un d»).
- Lielie burti («B un C kategorijas») ir ieroču kategorijas, tie netiek aiztikti.
- Ja variantus nevar droši parsēt, jautājums netiek jaukts (`questions.shuffle_disabled` + `shuffle_note`). Pašlaik tādu nav.
- Atbildes tiek salīdzinātas pēc oriģinālā burta, tāpēc jaukšana neietekmē progresu.
- `tests/shuffle.test.ts` pārbauda visus 515 jautājumus ar 40 sēklām.

## Lapas

| Ceļš | Kas |
|---|---|
| `/` | moduļi un tēmas |
| `/modulis/M1` | moduļa tēmas |
| `/tema/1-1` | tēma: nodarbība (4. posms) + jautājumu saraksts |
| `/tema/1-1/trenins` | treniņš: viens jautājums ekrānā, atbilde, skaidrojums, kļūdu atkārtošana |
| `/jautajums/243` | viens jautājums |
| `/saime/54?no=58` | «Salīdzināt līdzīgos» — saimes id = mazākais jautājuma numurs |
| `/meklet?q=…` | meklēšana pēc numura vai teksta |
| `/registreties`, `/pieslegties` | konts: e-pasts + parole vai saite e-pastā; Google, ja iestatīts |
| `/panelis` | progress pa moduļiem un tēmām, vājās tēmas, sērija, gatavība eksāmenam |
| `/kludas` | kļūdu atkārtošana pēc 1, 3, 7 dienām; `?visas=1` — visas kļūdas |
| `/eksamens`, `/eksamens/<id>` | izmēģinājuma eksāmens ar taimeri un rezultātu analīzi |

## Konti un progress

- **better-auth** glabā lietotājus tajā pašā Postgres (`user`, `session`, `account`, `verification`).
  Supabase Auth netika izmantots: lokālā Supabase nav palaižama šajā vidē, un atsevišķs auth serviss
  nav vajadzīgs. Supabase var izmantot kā Postgres hostingu.
- E-pasti: ar `RESEND_API_KEY` — caur Resend; bez tā — konsolē un `/api/dev/outbox` (tikai izstrādē).
- `answers` — katra atbilde (pēc oriģinālā burta); `question_progress` — kopsavilkums + atkārtošanas grafiks.
- Kļūda → atkārtot pēc 1 dienas; pareizi termiņā → pēc 3, tad pēc 7 dienām; tad apgūts. Kļūda jebkurā brīdī sāk no jauna.
- Izmēģinājuma eksāmens: jautājumi proporcionāli oficiālajām sadaļām I–X (lielāko atlikumu metode),
  atbildes saglabājas uzreiz, laiku kontrolē serveris; eksāmena laikā klientam netiek sūtītas pareizās atbildes.
  Iestatījumi: `app_settings.exam` (noklusējums `src/config/exam.ts`: 30 jaut., 60 min, 90 %).
- «Gatavs eksāmenam»: pēdējie 3 izmēģinājuma eksāmeni nokārtoti un visas tēmas ≥ 80 % (pēdējā atbilde pareiza).

## Struktūra

```
data/                 avota saturs + labojumi
drizzle/              SQL migrācijas
messages/lv.json      saskarnes teksti
e2e/                  Playwright testi
scripts/seed.ts       sēklošanas CLI
src/app/[locale]/     lapas
src/config/exam.ts    eksāmena noklusējumi (30 jaut., 60 min, 90 %), bezmaksas modulis
src/db/               Drizzle shēma un klients
src/lib/content/      satura ielāde, validācija, sēklošana, vaicājumi
src/lib/quiz/         variantu jaukšana, salīdzināšana (tīri moduļi)
tests/                Vitest
```

## Posmi

1. ✅ Karkass, datubāze, sēklošana, integritātes testi
2. ✅ Treniņš bez konta, variantu jaukšana, «Salīdzināt līdzīgos», meklēšana
3. ✅ Konti, progress, kļūdu labošana, izmēģinājuma eksāmens
4. Skaidrojumi un nodarbības (pēc likuma teksta `content/law/`)
5. Maksājumi (Stripe, vēlāk Montonio)
6. Administrācija, juridiskās lapas, SEO
7. Izvietošana (Vercel + Supabase)
