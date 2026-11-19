/** Jautājums treniņam — viss, kas vajadzīgs kartītei (koplietots starp serveri un klientu). */
export interface PracticeQuestion {
  id: number;
  topicId: string;
  text: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string | null;
  explanationStatus: "draft" | "reviewed";
  lawReference: string | null;
  possiblyOutdated: boolean;
  outdatedNote: string | null;
  shuffleDisabled: boolean;
  familyId: number | null;
  familySize: number;
  sourcePage: number;
}
