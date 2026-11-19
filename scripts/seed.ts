/**
 * Sēklošana no data/questions.json (+ data/corrections.json).
 *
 *   npm run db:seed            — ievieto trūkstošos ierakstus, esošos jautājumus nemaina
 *                                (lai nepārrakstītu administrācijā veiktos labojumus)
 *   npm run db:seed -- --reset — pārraksta jautājumu tekstus, variantus un pareizo atbildi
 *                                no faila (skaidrojumi, karogi un statusi saglabājas)
 */
import "dotenv/config";
import { loadContent } from "../src/lib/content/source";
import { validateContent } from "../src/lib/content/validate";
import { readExplanations, validateExplanations } from "../src/lib/content/explanations";

async function main() {
  const reset = process.argv.includes("--reset");
  const content = loadContent();

  const problems = validateContent(content);
  if (problems.length) {
    console.error("Satura validācija neizdevās:\n- " + problems.join("\n- "));
    process.exit(1);
  }

  const explProblems = validateExplanations(content);
  if (explProblems.length) {
    console.error("Skaidrojumu validācija neizdevās:\n- " + explProblems.join("\n- "));
    process.exit(1);
  }
  const { entries } = readExplanations();

  const { db } = await import("../src/db");
  const { seedDatabase } = await import("../src/lib/content/seed");
  const { inserted, updated, explained } = await seedDatabase(db, content, { reset, explanations: entries });
  console.log(
    `Sēklošana pabeigta: ${content.questions.length} jautājumi failā, ` +
      `ievietoti ${inserted}, pārrakstīti ${updated}${reset ? "" : " (--reset nav norādīts)"}; skaidrojumi atjaunoti ${explained} (statuss draft).`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
