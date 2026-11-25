import type { MetadataRoute } from "next";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { isFreeModule } from "@/lib/billing/access";
import { topicSlug } from "@/lib/content/queries";
import { siteUrl } from "@/lib/site/url";

export const dynamic = "force-dynamic";

/**
 * Lapas, kas viesim atveras bez pieslēgšanās: sākumlapa, jautājumu saraksts un katrs jautājums,
 * maksas moduļu un tēmu apraksti, cenas un juridiskās lapas. Bezmaksas modulis prasa reģistrāciju — kartē nav.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [mods, tops, qs] = await Promise.all([
    db.select({ id: schema.modules.id }).from(schema.modules).orderBy(asc(schema.modules.order)),
    db.select({ id: schema.topics.id, moduleId: schema.topics.moduleId }).from(schema.topics).orderBy(asc(schema.topics.order)),
    db.select({ id: schema.questions.id }).from(schema.questions).orderBy(asc(schema.questions.id)),
  ]);
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({
    url: `${base}${path}`,
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "weekly"),
    page("/jautajumi", 0.9, "weekly"),
    page("/iegadaties", 0.6),
    page("/registreties", 0.5),
    ...mods.filter((m) => !isFreeModule(m.id)).map((m) => page(`/modulis/${m.id}`, 0.7)),
    ...tops.filter((t) => !isFreeModule(t.moduleId)).map((t) => page(`/tema/${topicSlug(t.id)}`, 0.6)),
    ...qs.map((q) => page(`/jautajums/${q.id}`, 0.5)),
    page("/kontakti", 0.3, "yearly"),
    page("/noteikumi", 0.2, "yearly"),
    page("/privatums", 0.2, "yearly"),
    page("/sikdatnes", 0.2, "yearly"),
  ];
}
