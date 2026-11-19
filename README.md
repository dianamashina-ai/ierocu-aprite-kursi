# Ieroču aprites kursi

Mācību platforma sagatavošanai Valsts policijas kvalifikācijas pārbaudījumam
«par ieroču un munīcijas aprites kārtību un prasmēm rīkoties ar ieroci».

> Platforma ir sagatavošanās rīks, nevis oficiālais eksāmens, un nav saistīta ar Valsts policiju.

## Tehnoloģijas

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · next-intl (lv / ru) ·
PostgreSQL (lokāli vai Supabase) + Drizzle ORM · Vitest

## Lokālā palaišana

Vajag Node.js 22 un PostgreSQL 15+ (vietējo vai `supabase start`).

```bash
npm install
cp .env.example .env         # skriptiem (seed, migrācijas, testi)
cp .env.example .env.local   # Next.js
# izveido datubāzes, piem.:
#   createuser -P app && createdb -O app ierocu && createdb -O app ierocu_test
npm run db:setup             # migrācijas + sēklošana no data/questions.json
npm run dev                  # http://localhost:3000 (lv), http://localhost:3000/ru
```

## Skripti

| Komanda | Ko dara |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | Vitest: satura integritāte + DB sēklošana (ja iestatīts `TEST_DATABASE_URL`) |
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

## Struktūra

```
data/                 avota saturs + labojumi
drizzle/              SQL migrācijas
messages/             lv.json, ru.json (saskarnes teksti)
scripts/seed.ts       sēklošanas CLI
src/app/[locale]/     lapas
src/config/exam.ts    eksāmena noklusējumi (30 jaut., 60 min, 90 %), bezmaksas modulis
src/db/               Drizzle shēma un klients
src/lib/content/      satura ielāde, validācija, sēklošana, vaicājumi
tests/                Vitest
```

## Posmi

1. ✅ Karkass, datubāze, sēklošana, integritātes testi
2. Treniņš bez konta, variantu jaukšana, «Salīdzināt līdzīgos»
3. Konti, progress, kļūdu labošana, izmēģinājuma eksāmens
4. Skaidrojumi un nodarbības (pēc likuma teksta `content/law/`)
5. Maksājumi (Stripe, vēlāk Montonio)
6. Administrācija, juridiskās lapas, SEO
7. Izvietošana (Vercel + Supabase)
