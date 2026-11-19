import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

const { designNotes } = schema;

export interface NewNote {
  path: string;
  selector: string;
  elementText?: string | null;
  viewportWidth: number;
  viewportHeight: number;
  comment: string;
}

export async function addNote(userId: string, n: NewNote) {
  const [row] = await db
    .insert(designNotes)
    .values({
      id: randomUUID(),
      userId,
      path: n.path.slice(0, 300),
      selector: n.selector.slice(0, 1000),
      elementText: n.elementText?.slice(0, 200) ?? null,
      viewportWidth: Math.round(n.viewportWidth),
      viewportHeight: Math.round(n.viewportHeight),
      comment: n.comment.trim().slice(0, 4000),
    })
    .returning();
  return row;
}

export function openNotesForPath(path: string) {
  return db
    .select()
    .from(designNotes)
    .where(and(eq(designNotes.path, path), eq(designNotes.status, "open")))
    .orderBy(asc(designNotes.createdAt));
}

export function listNotes(status?: "open" | "done") {
  return db
    .select()
    .from(designNotes)
    .where(status ? eq(designNotes.status, status) : undefined)
    .orderBy(status === "done" ? desc(designNotes.resolvedAt) : asc(designNotes.createdAt));
}

export async function updateNote(id: string, patch: { status?: "open" | "done"; reply?: string | null; comment?: string }) {
  const set: Partial<typeof designNotes.$inferInsert> = {};
  if (patch.status) {
    set.status = patch.status;
    set.resolvedAt = patch.status === "done" ? new Date() : null;
  }
  if (patch.reply !== undefined) set.reply = patch.reply?.slice(0, 4000) ?? null;
  if (patch.comment !== undefined) set.comment = patch.comment.trim().slice(0, 4000);
  const [row] = await db.update(designNotes).set(set).where(eq(designNotes.id, id)).returning();
  return row ?? null;
}

export async function deleteNote(id: string) {
  await db.delete(designNotes).where(eq(designNotes.id, id));
}
