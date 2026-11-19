import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { listNotes, updateNote } from "@/lib/notes/service";

export const dynamic = "force-dynamic";

/** Piekļuve izstrādātājam: Authorization: Bearer <NOTES_API_KEY>. Bez atslēgas — 404. */
function authorized(req: Request) {
  const key = process.env.NOTES_API_KEY;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!key || key.length < 32 || given.length !== key.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(key));
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const s = new URL(req.url).searchParams.get("status");
  const notes = await listNotes(s === "done" ? "done" : s === "all" ? undefined : "open");
  return NextResponse.json({ notes });
}

const Patch = z.object({
  id: z.string().min(1),
  status: z.enum(["open", "done"]).optional(),
  reply: z.string().max(4000).nullable().optional(),
});

export async function PATCH(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = Patch.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { id, ...patch } = body.data;
  const note = await updateNote(id, patch);
  return note ? NextResponse.json({ note }) : NextResponse.json({ error: "not found" }, { status: 404 });
}
