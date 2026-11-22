import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule, moduleOfTopic } from "@/lib/billing/access";
import { loadFamilyComparison } from "@/lib/content/family";

export const dynamic = "force-dynamic";

/** Līdzīgo jautājumu salīdzinājums izbīdāmajam panelim (tikai ar piekļuvi modulim). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,3}$/.test(id)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const no = new URL(req.url).searchParams.get("no");
  const data = await loadFamilyComparison(Number(id), no && /^\d+$/.test(no) ? Number(no) : null);
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  const user = await getCurrentUser();
  if (!(await canAccessModule(user?.id, moduleOfTopic(data.topicId)))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json(data);
}
