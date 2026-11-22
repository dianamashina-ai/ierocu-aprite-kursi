import "server-only";
import { getCourseOverview } from "@/lib/content/queries";
import { FREE_MODULE_IDS } from "@/config/exam";

/** Cik moduļu un jautājumu vēl ir pilnajā kursā (ārpus bezmaksas moduļiem). */
export async function lockedTotals() {
  const c = await getCourseOverview();
  const locked = c.modules.filter((m) => !(FREE_MODULE_IDS as readonly string[]).includes(m.id));
  return { modulesLeft: locked.length, questionsLeft: locked.reduce((s, m) => s + m.questionCount, 0) };
}
