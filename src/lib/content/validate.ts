/**
 * Satura integritātes pārbaudes. Atgriež problēmu sarakstu (tukšs = viss kārtībā).
 * Izmanto gan sēklošana (aptur, ja ir kļūdas), gan Vitest testi.
 */
import { OPTION_KEYS, type Content } from "./source";

export const EXPECTED_QUESTION_COUNT = 515;

export function validateContent(c: Content): string[] {
  const p: string[] = [];

  // Kopskaits un numerācija 1..515
  if (c.questions.length !== EXPECTED_QUESTION_COUNT)
    p.push(`jautājumu skaits ${c.questions.length}, gaidīts ${EXPECTED_QUESTION_COUNT}`);
  if (c.meta.total_questions !== c.questions.length)
    p.push(`meta.total_questions=${c.meta.total_questions} ≠ ${c.questions.length}`);
  const ids = c.questions.map((q) => q.id).sort((a, b) => a - b);
  ids.forEach((id, i) => {
    if (id !== i + 1) p.push(`numerācijā pārrāvums vai dublikāts pie pozīcijas ${i + 1}: ${id}`);
  });

  const sectionIds = new Set(c.officialSections.map((s) => s.id));
  const moduleIds = new Set(c.modules.map((m) => m.id));
  const topicById = new Map(c.topics.map((t) => [t.id, t]));
  const byId = new Map(c.questions.map((q) => [q.id, q]));

  if (c.officialSections.length !== 10) p.push(`oficiālo sadaļu skaits ${c.officialSections.length}, gaidīts 10`);
  if (topicById.size !== c.topics.length) p.push("dublēti tēmu id");

  // Katrs jautājums tieši vienā tēmā; tēmas summa = 515
  const seen = new Map<number, string>();
  for (const t of c.topics) {
    if (!moduleIds.has(t.moduleId)) p.push(`tēma ${t.id}: nezināms modulis ${t.moduleId}`);
    for (const qid of t.questionIds) {
      if (!byId.has(qid)) p.push(`tēma ${t.id}: neeksistējošs jautājums ${qid}`);
      if (seen.has(qid)) p.push(`jautājums ${qid} ir gan tēmā ${seen.get(qid)}, gan ${t.id}`);
      seen.set(qid, t.id);
    }
  }
  const topicSum = c.topics.reduce((s, t) => s + t.questionIds.length, 0);
  if (topicSum !== EXPECTED_QUESTION_COUNT) p.push(`tēmu jautājumu summa ${topicSum} ≠ ${EXPECTED_QUESTION_COUNT}`);

  for (const q of c.questions) {
    const tag = `Q${q.id}`;
    const inTopic = seen.get(q.id);
    if (!inTopic) p.push(`${tag}: nav nevienā tēmā`);
    else if (inTopic !== q.topicId) p.push(`${tag}: lauks topic=${q.topicId}, bet tēmu sarakstā ${inTopic}`);
    const topic = topicById.get(q.topicId);
    if (topic && topic.moduleId !== q.moduleId)
      p.push(`${tag}: modulis ${q.moduleId} neatbilst tēmas modulim ${topic.moduleId}`);
    if (!sectionIds.has(q.officialSectionId)) p.push(`${tag}: nezināma sadaļa ${q.officialSectionId}`);

    // Varianti: 2–6, burti a.. pēc kārtas, unikāli, nav tukši
    const n = q.options.length;
    if (n < 2 || n > 6) p.push(`${tag}: ${n} varianti (atļauts 2–6)`);
    const keys = q.options.map((o) => o.key).join("");
    if (keys !== OPTION_KEYS.slice(0, n).join("")) p.push(`${tag}: variantu burti "${keys}"`);
    if (q.options.some((o) => !o.text.trim())) p.push(`${tag}: tukšs variants`);
    const texts = q.options.map((o) => o.text.trim());
    if (new Set(texts).size !== texts.length) p.push(`${tag}: dublēts varianta teksts`);

    // Tieši viena pareizā atbilde, kas ir starp variantiem
    const matches = q.options.filter((o) => o.key === q.correctKey).length;
    if (matches !== 1) p.push(`${tag}: pareizā atbilde "${q.correctKey}" atrasta ${matches} reizes`);

    // Līdzīgie jautājumi: simetriski un eksistē
    for (const s of q.similarQuestionIds) {
      const other = byId.get(s);
      if (!other) p.push(`${tag}: līdzīgais jautājums ${s} neeksistē`);
      else if (!other.similarQuestionIds.includes(q.id)) p.push(`${tag}: līdzība ar ${s} nav simetriska`);
      if (s === q.id) p.push(`${tag}: līdzīgs pats sev`);
    }
  }

  return p;
}
