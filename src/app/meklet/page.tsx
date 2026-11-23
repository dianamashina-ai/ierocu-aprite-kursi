import { redirect } from "next/navigation";

/** Vecā meklēšanas adrese → sadaļa “Jautājumi”. */
export default async function SearchRedirect({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q;
  redirect(q ? `/jautajumi?q=${encodeURIComponent(q)}` : "/jautajumi");
}
