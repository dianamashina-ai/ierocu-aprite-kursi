import { seededRandom } from "@/lib/quiz/shuffle";

/**
 * Sadala `n` jautājumus starp oficiālajām sadaļām proporcionāli to lielumam
 * (lielāko atlikumu metode). Summa vienmēr = n; neviena sadaļa nepārsniedz savu lielumu.
 */
export function allocateBySection(sizes: Record<string, number>, n: number): Record<string, number> {
  const entries = Object.entries(sizes).filter(([, s]) => s > 0);
  const total = entries.reduce((a, [, s]) => a + s, 0);
  if (n > total) throw new Error(`Pieprasīti ${n} jautājumi, pieejami tikai ${total}`);
  const raw = entries.map(([id, s]) => ({ id, s, exact: (s / total) * n }));
  const out: Record<string, number> = {};
  for (const r of raw) out[r.id] = Math.min(r.s, Math.floor(r.exact));
  let left = n - Object.values(out).reduce((a, b) => a + b, 0);
  const order = [...raw].sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)) || b.s - a.s);
  while (left > 0) {
    for (const r of order) {
      if (left === 0) break;
      if (out[r.id] < r.s) {
        out[r.id]++;
        left--;
      }
    }
  }
  return out;
}

/** Nejauša, bet atkārtojama (pēc sēklas) izmēģinājuma eksāmena jautājumu izlase. */
export function sampleExam(questions: { id: number; officialSectionId: string }[], n: number, seed: string): number[] {
  const bySection = new Map<string, number[]>();
  for (const q of questions) {
    if (!bySection.has(q.officialSectionId)) bySection.set(q.officialSectionId, []);
    bySection.get(q.officialSectionId)!.push(q.id);
  }
  const alloc = allocateBySection(Object.fromEntries([...bySection].map(([k, v]) => [k, v.length])), n);
  const rand = seededRandom(seed);
  const shuffle = <T,>(a: T[]) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const picked: number[] = [];
  for (const [sec, ids] of [...bySection].sort(([a], [b]) => a.localeCompare(b))) {
    picked.push(...shuffle([...ids].sort((a, b) => a - b)).slice(0, alloc[sec] ?? 0));
  }
  return shuffle(picked);
}
