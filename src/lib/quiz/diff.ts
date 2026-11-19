/**
 * Vienkāršs vārdu līmeņa salīdzinājums (LCS) — "Salīdzināt līdzīgos" režīmam.
 * Tīrs modulis, izmantojams gan serverī, gan klientā.
 */
import { extractLetterRefs, isMetaOption } from "./shuffle";

export interface DiffToken {
  text: string; // vārds kopā ar sekojošo atstarpi
  changed: boolean;
}

function tokenize(s: string): string[] {
  return s.match(/\S+\s*/g) ?? [];
}

const norm = (w: string) => w.trim().toLowerCase().replace(/[.,;:()"«»]+/g, "");

/** Atzīmē vārdus tekstā `a`, kuru nav tekstā `b` (pēc garākās kopīgās apakšvirknes). */
export function diffWords(a: string, b: string): DiffToken[] {
  const A = tokenize(a);
  const B = tokenize(b);
  const n = A.length;
  const m = B.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = norm(A[i]) === norm(B[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const out: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < n) {
    if (j < m && norm(A[i]) === norm(B[j])) {
      out.push({ text: A[i], changed: false });
      i++;
      j++;
    } else if (j < m && dp[i][j + 1] > dp[i + 1][j]) {
      j++;
    } else {
      out.push({ text: A[i], changed: true });
      i++;
    }
  }
  return out;
}

/** Līdzība 0..1 pēc kopīgo vārdu daļas (Dice). */
export function similarity(a: string, b: string): number {
  const A = tokenize(a).map(norm);
  const B = tokenize(b).map(norm);
  if (!A.length || !B.length) return 0;
  const counts = new Map<string, number>();
  for (const w of B) counts.set(w, (counts.get(w) ?? 0) + 1);
  let common = 0;
  for (const w of A) {
    const c = counts.get(w) ?? 0;
    if (c > 0) {
      common++;
      counts.set(w, c - 1);
    }
  }
  return (2 * common) / (A.length + B.length);
}

const key = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

export interface FamilyOptionView {
  key: string;
  text: string;
  isCorrect: boolean;
  /** Kombinācija ("a un b variants", "visas atbildes…") — nozīme atkarīga no pārējiem variantiem */
  isMeta: boolean;
  /** Kombinācijai: uz kuriem variantiem tā atsaucas (null = uz visiem / nevienu) */
  refersTo: string[] | null;
  /** Cik citos saimes jautājumos ir tieši tāds pats variants */
  sharedWith: number[];
  /** Ja variants ir unikāls un ir ļoti līdzīgs variantam citā jautājumā — atšķirīgie vārdi */
  tokens: DiffToken[] | null;
  similarTo: number | null;
}

export interface FamilyQuestionView {
  id: number;
  text: string;
  textTokens: DiffToken[] | null; // ja formulējums atšķiras no vairākuma
  correctKey: string;
  correctText: string;
  options: FamilyOptionView[];
}

/**
 * Sagatavo saimes salīdzinājumu: kuri varianti atkārtojas, kuri ir unikāli,
 * un kuri vārdi atšķiras gandrīz vienādos variantos.
 */
export function buildFamilyComparison(
  questions: { id: number; text: string; correctKey: string; options: { key: string; text: string }[] }[],
  { similarThreshold = 0.6 }: { similarThreshold?: number } = {},
): FamilyQuestionView[] {
  // vairākuma formulējums
  const textCounts = new Map<string, { n: number; text: string }>();
  for (const q of questions) {
    const k = key(q.text);
    textCounts.set(k, { n: (textCounts.get(k)?.n ?? 0) + 1, text: q.text });
  }
  const majority = [...textCounts.values()].sort((a, b) => b.n - a.n)[0]?.text ?? "";

  const where = new Map<string, number[]>();
  for (const q of questions)
    for (const o of q.options) {
      if (isMetaOption(o.text)) continue;
      const k = key(o.text);
      if (!where.has(k)) where.set(k, []);
      where.get(k)!.push(q.id);
    }

  return questions.map((q) => {
    const options = q.options.map<FamilyOptionView>((o) => {
      if (isMetaOption(o.text)) {
        // Vienāds teksts ("b un c variants") citā jautājumā nozīmē ko citu — nesalīdzinām
        const refs = extractLetterRefs(o.text).flat();
        return {
          key: o.key, text: o.text, isCorrect: o.key === q.correctKey, isMeta: true,
          refersTo: refs.length ? refs : null, sharedWith: [], tokens: null, similarTo: null,
        };
      }
      const sharedWith = (where.get(key(o.text)) ?? []).filter((id) => id !== q.id);
      let tokens: DiffToken[] | null = null;
      let similarTo: number | null = null;
      if (sharedWith.length === 0) {
        let best = { score: 0, text: "", id: 0 };
        for (const other of questions) {
          if (other.id === q.id) continue;
          for (const oo of other.options) {
            if (isMetaOption(oo.text)) continue;
            const s = similarity(o.text, oo.text);
            if (s > best.score) best = { score: s, text: oo.text, id: other.id };
          }
        }
        if (best.score >= similarThreshold && best.score < 1) {
          tokens = diffWords(o.text, best.text);
          similarTo = best.id;
        }
      }
      return {
        key: o.key, text: o.text, isCorrect: o.key === q.correctKey, isMeta: false,
        refersTo: null, sharedWith, tokens, similarTo,
      };
    });
    return {
      id: q.id,
      text: q.text,
      textTokens: key(q.text) === key(majority) ? null : diffWords(q.text, majority),
      correctKey: q.correctKey,
      correctText: q.options.find((o) => o.key === q.correctKey)?.text ?? "",
      options,
    };
  });
}
