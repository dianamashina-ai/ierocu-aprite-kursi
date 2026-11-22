/** Kas iekļauts pilnajā piekļuvē (sākumlapai un pirkšanas lapai). */
export function courseIncluded(t: { modules: number; topics: number; questions: number }, exam: { questions: number; minutes: number }) {
  return [
    `Visi ${t.modules} moduļi un ${t.topics} īsas nodarbības`,
    `Visi ${t.questions} oficiālie jautājumi ar skaidrojumiem un atsaucēm uz likumu`,
    `Neierobežoti izmēģinājuma eksāmeni (${exam.questions} jautājumi, ${exam.minutes} minūtes)`,
    "Treniņš ar jautājumiem, kuros kļūdies",
  ];
}
