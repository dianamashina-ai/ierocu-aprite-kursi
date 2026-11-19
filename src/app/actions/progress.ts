"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { finishExam, ProgressError, recordAnswer, saveExamAnswer, startExam } from "@/lib/progress/service";

type Result = { ok: true } | { ok: false; error: string };

const safe = async (fn: () => Promise<unknown>): Promise<Result> => {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    if (e instanceof ProgressError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Neizdevās saglabāt. Pārbaudi interneta savienojumu." };
  }
};

export async function recordAnswerAction(questionId: number, key: string, mode: "practice" | "review"): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Nav pieslēgts" };
  return safe(() => recordAnswer(user.id, questionId, key, mode));
}

export async function startExamAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/pieslegties?next=/eksamens");
  const id = await startExam(user.id);
  redirect(`/eksamens/${id}`);
}

export async function saveExamAnswerAction(attemptId: string, questionId: number, key: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Nav pieslēgts" };
  return safe(() => saveExamAnswer(user.id, attemptId, questionId, key));
}

export async function finishExamAction(attemptId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Nav pieslēgts" };
  const r = await safe(() => finishExam(user.id, attemptId));
  revalidatePath(`/eksamens/${attemptId}`);
  return r;
}
