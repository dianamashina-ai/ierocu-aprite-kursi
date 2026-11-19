"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { addNote, deleteNote, openNotesForPath, updateNote } from "@/lib/notes/service";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) throw new Error("Nav tiesību");
  return user;
}

const NoteInput = z.object({
  path: z.string().min(1).max(300),
  selector: z.string().min(1).max(1000),
  elementText: z.string().max(200).nullable().optional(),
  viewportWidth: z.number().positive(),
  viewportHeight: z.number().positive(),
  comment: z.string().trim().min(1).max(4000),
});

export async function addNoteAction(input: z.infer<typeof NoteInput>) {
  const user = await requireAdmin();
  const note = await addNote(user.id, NoteInput.parse(input));
  revalidatePath("/labojumi");
  return { id: note.id };
}

export async function notesForPathAction(path: string) {
  await requireAdmin();
  const rows = await openNotesForPath(path);
  return rows.map((n) => ({ id: n.id, selector: n.selector, comment: n.comment, reply: n.reply }));
}

export async function setNoteStatusAction(id: string, status: "open" | "done") {
  await requireAdmin();
  await updateNote(id, { status });
  revalidatePath("/labojumi");
}

export async function deleteNoteAction(id: string) {
  await requireAdmin();
  await deleteNote(id);
  revalidatePath("/labojumi");
}
