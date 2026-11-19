/**
 * Intervālu atkārtošana kļūdām: kļūdains jautājums atgriežas pēc 1, 3 un 7 dienām.
 *
 *  - nepareiza atbilde (jebkurā brīdī) → 1. posms, nākamā reize pēc 1 dienas
 *  - pareiza atbilde, kad atkārtošana ir pienākusi → nākamais posms (3, tad 7 dienas);
 *    pēc 3. posma jautājums tiek uzskatīts par apgūtu (vairs nav jāatkārto)
 *  - pareiza atbilde pirms termiņa → grafiks nemainās
 */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7] as const;
const DAY = 24 * 60 * 60 * 1000;

export interface ReviewState {
  reviewStage: number; // 0 = nav jāatkārto; 1..3
  nextReviewAt: Date | null;
}

export function nextReviewState(prev: ReviewState | null, isCorrect: boolean, now: Date): ReviewState {
  if (!isCorrect) return { reviewStage: 1, nextReviewAt: new Date(now.getTime() + REVIEW_INTERVALS_DAYS[0] * DAY) };
  if (!prev || prev.reviewStage === 0) return { reviewStage: 0, nextReviewAt: null };
  const due = prev.nextReviewAt !== null && prev.nextReviewAt.getTime() <= now.getTime();
  if (!due) return prev;
  if (prev.reviewStage >= REVIEW_INTERVALS_DAYS.length) return { reviewStage: 0, nextReviewAt: null };
  return {
    reviewStage: prev.reviewStage + 1,
    nextReviewAt: new Date(now.getTime() + REVIEW_INTERVALS_DAYS[prev.reviewStage] * DAY),
  };
}
