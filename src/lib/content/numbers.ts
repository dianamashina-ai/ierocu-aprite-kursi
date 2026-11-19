/**
 * Kartītes "Skaitļi, kas jāatceras" (content/numbers.json).
 * Katram skaitlim ir avots, ko pārbauda pret content/law tekstiem (validateNumbers).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { lawArticleIndex, parseLawReference } from "./explanations";

const CardSchema = z.object({
  id: z.number().int().positive(),
  value: z.string().min(1).max(40),
  prompt: z.string().min(10),
  topic: z.string().regex(/^\d+\.\d+$/),
  source: z.string().min(5),
});

export type NumberCard = z.infer<typeof CardSchema>;

export function readNumbers(file = path.join(process.cwd(), "content", "numbers.json")): NumberCard[] {
  return z.array(CardSchema).parse(JSON.parse(readFileSync(file, "utf8")));
}

export function validateNumbers(topicIds: string[], cards = readNumbers()) {
  const problems: string[] = [];
  const index = lawArticleIndex();
  const topics = new Set(topicIds);
  const ids = new Set<number>();
  for (const c of cards) {
    if (ids.has(c.id)) problems.push(`Kartīte ${c.id}: dublēts id`);
    ids.add(c.id);
    if (!topics.has(c.topic)) problems.push(`Kartīte ${c.id}: tēma ${c.topic} neeksistē`);
    const refs = parseLawReference(c.source);
    if (!refs.length) problems.push(`Kartīte ${c.id}: avotā nav atpazīts pants vai punkts`);
    for (const r of refs) if (!index[r.law]?.has(r.article)) problems.push(`Kartīte ${c.id}: ${r.law} ${r.article} nav content/law tekstā`);
  }
  return problems;
}
