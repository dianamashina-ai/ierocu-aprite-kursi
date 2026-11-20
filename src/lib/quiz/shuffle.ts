/**
 * Atbilžu variantu jaukšana.
 *
 * Noteikumi:
 *  - "Meta" varianti (kombinācijas "a un b variants", "visas atbildes ir pareizas",
 *    "neviena atbilde nav pareiza" u. tml.) vienmēr paliek beigās, savā sākotnējā secībā.
 *  - Parastie varianti tiek sajaukti, burti piešķirti no jauna (a, b, c…).
 *  - Burti kombināciju tekstā tiek pārrakstīti atbilstoši jaunajai secībai.
 *  - Ja variantus nevar droši parsēt, jautājums netiek jaukts (analyzeOptions → shuffleable=false).
 *
 * Atbildes vienmēr glabā pēc ORIĢINĀLĀ burta (originalKey) — tas nav atkarīgs no jaukšanas.
 * Modulis ir tīrs (bez DB/React), to izmanto gan serveris, gan klients.
 */

export const KEYS = ["a", "b", "c", "d", "e", "f"] as const;

export interface QuizOption {
  key: string; // oriģinālais (normalizētais) burts
  text: string;
}

export interface DisplayOption {
  displayKey: string; // burts, ko redz skolēns
  originalKey: string;
  text: string; // teksts ar pārrakstītiem burtiem (kombinācijām)
  isMeta: boolean;
}

/** Varianti, kas atsaucas uz citiem variantiem (kopā vai visiem). */
const META_PATTERNS: RegExp[] = [
  /variant/i, // varianti, variantos, variantā, variants…
  /apakšpunkt/i,
  /(?:^|\s)(?:visas|visās|neviena)\s+(?:ir\s+)?atbild(?:es|ēs|e)(?:\s|$)/i,
  /(?:^|\s)vis(?:i|as|u|os|ās)\s+(?:norādīt|minēt)/i,
];

/**
 * Burtu grupa pirms vārda "variant…" vai "apakšpunkt…":
 * "a un b", "a vai b", "a, b un c". Tikai mazie burti (lielie = ieroču kategorijas).
 */
const LETTER_GROUP =
  /(?<![\p{L}\d])([a-f](?:\s*,\s*[a-f])*\s+(?:un|vai)\s+[a-f])(?=\s+(?:variant|apakšpunkt))/giu;

const LONE_LETTER = /(?<![\p{L}\d.])[a-f](?![\p{L}\d])/gu;

export function isMetaOption(text: string): boolean {
  return META_PATTERNS.some((re) => re.test(text));
}

/** Atgriež visas burtu grupas tekstā (piem. [["a","b"]]). */
export function extractLetterRefs(text: string): string[][] {
  return [...text.matchAll(LETTER_GROUP)].map((m) => splitGroup(m[1]));
}

/** "a, b un c" → ["a","b","c"] (nevis burti no vārdiem "un"/"vai"). */
function splitGroup(group: string): string[] {
  return group.trim().split(/\s*,\s*|\s+(?:un|vai)\s+/);
}

export interface OptionAnalysis {
  shuffleable: boolean;
  reason: string | null;
  meta: boolean[]; // katram variantam
}

export function analyzeOptions(options: QuizOption[]): OptionAnalysis {
  const meta = options.map((o) => isMetaOption(o.text));
  const fail = (reason: string): OptionAnalysis => ({ shuffleable: false, reason, meta });

  // Meta variantiem jābūt beigās (avotā tā ir vienmēr; ja nē — nejaucam).
  const firstMeta = meta.indexOf(true);
  if (firstMeta !== -1 && meta.slice(firstMeta).some((m) => !m))
    return fail("kombinācijas variants nav saraksta beigās");

  const regularKeys = new Set(options.filter((_, i) => !meta[i]).map((o) => o.key));
  if (regularKeys.size < 2) return { shuffleable: false, reason: "mazāk par 2 parastajiem variantiem", meta };

  for (let i = 0; i < options.length; i++) {
    if (!meta[i]) continue;
    const text = options[i].text;
    const refs = extractLetterRefs(text).flat();
    for (const r of refs) {
      if (!regularKeys.has(r)) return fail(`variants ${options[i].key} atsaucas uz "${r}", kas nav parasts variants`);
    }
    // Pēc zināmo grupu izņemšanas tekstā nedrīkst palikt atsevišķi burti a–f.
    const rest = text.replace(LETTER_GROUP, " ");
    if (LONE_LETTER.test(rest)) {
      LONE_LETTER.lastIndex = 0;
      return fail(`variantā ${options[i].key} ir burts, ko nevar droši interpretēt: "${text}"`);
    }
  }
  return { shuffleable: true, reason: null, meta };
}

/** Deterministisks PRNG (mulberry32) no teksta sēklas. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rewriteLetters(text: string, map: Map<string, string>): string {
  return text.replace(LETTER_GROUP, (group) => {
    const letters = splitGroup(group).map((l) => map.get(l) ?? l).sort();
    const connector = /\svai\s/.test(group) ? "vai" : "un";
    if (letters.length === 2) return `${letters[0]} ${connector} ${letters[1]}`;
    return `${letters.slice(0, -1).join(", ")} ${connector} ${letters[letters.length - 1]}`;
  });
}

/**
 * Sajauc variantus. Ar `disabled=true` (vai ja nav droši parsējams) atgriež oriģinālo secību.
 * Viena un tā pati sēkla vienmēr dod vienu un to pašu secību.
 */
export function shuffleOptions(
  options: QuizOption[],
  seed: string,
  { disabled = false }: { disabled?: boolean } = {},
): DisplayOption[] {
  const analysis = analyzeOptions(options);
  if (disabled || !analysis.shuffleable) {
    return options.map((o, i) => ({ displayKey: o.key, originalKey: o.key, text: o.text, isMeta: analysis.meta[i] }));
  }

  const regular = options.filter((_, i) => !analysis.meta[i]);
  const metas = options.filter((_, i) => analysis.meta[i]);

  const rand = seededRandom(seed);
  const order = [...regular];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const map = new Map<string, string>(); // oriģinālais → jaunais burts
  order.forEach((o, i) => map.set(o.key, KEYS[i]));

  return [
    ...order.map((o, i) => ({ displayKey: KEYS[i], originalKey: o.key, text: o.text, isMeta: false })),
    ...metas.map((o, i) => ({
      displayKey: KEYS[order.length + i],
      originalKey: o.key,
      text: rewriteLetters(o.text, map),
      isMeta: true,
    })),
  ];
}

/** Rādīšanai: burtu grupas pirms "variant…"/"apakšpunkt…" ar lielajiem burtiem ("a un c variants" → "A un C variants"). */
export function uppercaseLetterRefs(text: string): string {
  return text.replace(LETTER_GROUP, (group) => group.replace(/\b[a-f]\b/g, (l) => l.toUpperCase()));
}
