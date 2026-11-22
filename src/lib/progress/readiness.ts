export const READY_TOPIC_PERCENT = 80;
export const READY_LAST_EXAMS = 5;

export interface ReadinessInput {
  /** Pēdējie pabeigtie izmēģinājuma eksāmeni, jaunākais pirmais */
  recentExams: { passed: boolean }[];
  /** Tēmas apguves procents (pēdējā atbilde pareiza / jautājumi tēmā) */
  topicPercents: { topicId: string; percent: number }[];
}

export interface Readiness {
  ready: boolean;
  examsPassed: number; // no pēdējiem READY_LAST_EXAMS
  topicsBelow: string[];
}

/** «Gatavs eksāmenam»: pēdējie READY_LAST_EXAMS (5) izmēģinājuma eksāmeni nokārtoti un visas tēmas ≥ 80 %. */
export function readiness({ recentExams, topicPercents }: ReadinessInput): Readiness {
  const last = recentExams.slice(0, READY_LAST_EXAMS);
  const examsPassed = last.filter((e) => e.passed).length;
  const topicsBelow = topicPercents.filter((t) => t.percent < READY_TOPIC_PERCENT).map((t) => t.topicId);
  return { ready: last.length === READY_LAST_EXAMS && examsPassed === READY_LAST_EXAMS && topicsBelow.length === 0, examsPassed, topicsBelow };
}
