"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { seededRandom } from "@/lib/quiz/shuffle";
import type { NumberCard } from "@/lib/content/numbers";

interface Props {
  cards: NumberCard[];
  modules: { id: string; order: number; title: string }[];
  topicTitles: Record<string, string>;
}

type Mode = "prompt" | "value"; // ko rāda kartītes priekšpusē
type View = "cards" | "list";

const slug = (t: string) => t.replace(".", "-");
const moduleOf = (topic: string) => `M${topic.split(".")[0]}`;

function shuffled<T>(arr: T[], seed: string) {
  const a = [...arr];
  const rand = seededRandom(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function NumberCards({ cards, modules, topicTitles }: Props) {
  const [view, setView] = useState<View>("cards");
  const [mode, setMode] = useState<Mode>("prompt");
  const [moduleId, setModuleId] = useState<string>("all");
  const [round, setRound] = useState(0);
  const [queue, setQueue] = useState<NumberCard[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [again, setAgain] = useState<NumberCard[]>([]);

  const selected = useMemo(
    () => (moduleId === "all" ? cards : cards.filter((c) => moduleOf(c.topic) === moduleId)),
    [cards, moduleId],
  );

  const start = useCallback(
    (list: NumberCard[], r: number) => {
      setQueue(shuffled(list, `skaitli:${moduleId}:${r}`));
      setPos(0);
      setFlipped(false);
      setKnown(0);
      setAgain([]);
    },
    [moduleId],
  );

  useEffect(() => {
    start(selected, round);
  }, [selected, round, start]);

  const card = queue[pos];
  const done = queue.length > 0 && pos >= queue.length;

  const answer = useCallback(
    (ok: boolean) => {
      if (!card || !flipped) return;
      if (ok) setKnown((k) => k + 1);
      else setAgain((a) => [...a, card]);
      setPos((p) => p + 1);
      setFlipped(false);
    },
    [card, flipped],
  );

  useEffect(() => {
    if (view !== "cards" || done) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, select, textarea, button, a")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && (e.key === "ArrowRight" || e.key.toLowerCase() === "z")) answer(true);
      else if (flipped && (e.key === "ArrowLeft" || e.key.toLowerCase() === "a")) answer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, done, flipped, answer]);

  const toggle = (active: boolean) =>
    `min-h-11 rounded-lg px-3 text-sm font-semibold ${active ? "bg-accent text-white" : "text-muted hover:bg-accent-soft"}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div role="group" aria-label="Skats" className="flex gap-1 rounded-xl border border-line bg-white p-1">
          <button type="button" aria-pressed={view === "cards"} className={toggle(view === "cards")} onClick={() => setView("cards")}>
            Kartītes
          </button>
          <button type="button" aria-pressed={view === "list"} className={toggle(view === "list")} onClick={() => setView("list")}>
            Saraksts
          </button>
        </div>
        <label className="w-full min-w-0 text-sm sm:w-auto">
          <span className="text-muted">Modulis</span>
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            className="mt-1 block min-h-11 w-full max-w-full truncate rounded-lg border-2 border-line bg-white px-3 sm:max-w-xs"
          >
            <option value="all">Visi ({cards.length})</option>
            {modules
              .filter((m) => cards.some((c) => moduleOf(c.topic) === m.id))
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.order}. {m.title} ({cards.filter((c) => moduleOf(c.topic) === m.id).length})
                </option>
              ))}
          </select>
        </label>
        {view === "cards" && (
          <div role="group" aria-label="Priekšpusē rādīt" className="flex gap-1 rounded-xl border border-line bg-white p-1">
            <button type="button" aria-pressed={mode === "prompt"} className={toggle(mode === "prompt")} onClick={() => { setMode("prompt"); setFlipped(false); }}>
              Jautājums → skaitlis
            </button>
            <button type="button" aria-pressed={mode === "value"} className={toggle(mode === "value")} onClick={() => { setMode("value"); setFlipped(false); }}>
              Skaitlis → nozīme
            </button>
          </div>
        )}
      </div>

      {view === "list" ? (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {selected.map((c) => (
            <li key={c.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
              <span className="shrink-0 font-semibold tabular-nums text-accent-strong sm:w-44">{c.value}</span>
              <span className="flex-1">
                {c.prompt}
                <span className="mt-0.5 block text-xs text-muted">
                  {c.source} ·{" "}
                  <Link href={`/tema/${slug(c.topic)}`} className="underline underline-offset-2">
                    Tēma {c.topic}
                  </Link>
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : done ? (
        <section aria-labelledby="done-h" className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <h2 id="done-h" className="text-2xl font-semibold">Aplis pabeigts</h2>
          <p className="mt-2 text-lg">
            Zini {known} no {queue.length}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {again.length > 0 && (
              <button type="button" className="btn-primary" onClick={() => start(again, round + 100)}>
                Atkārtot nezināmās ({again.length})
              </button>
            )}
            <button type="button" className={again.length ? "btn-secondary" : "btn-primary"} onClick={() => setRound((r) => r + 1)}>
              Sākt no jauna
            </button>
          </div>
        </section>
      ) : card ? (
        <section aria-label="Kartīte" className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              {pos + 1} no {queue.length}
            </span>
            <span>Zini: {known}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-accent-soft" aria-hidden="true">
            <div className="h-full bg-accent transition-[width] motion-reduce:transition-none" style={{ width: `${(pos / queue.length) * 100}%` }} />
          </div>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? "Kartīte: atbilde redzama. Nospied, lai paslēptu" : "Kartīte: nospied, lai redzētu atbildi"}
            className="flex min-h-64 w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-line bg-white p-6 text-center hover:border-accent sm:p-10"
          >
            {mode === "prompt" ? (
              <span className="text-lg leading-snug sm:text-xl">{card.prompt}</span>
            ) : (
              <span className="text-4xl font-bold tabular-nums text-accent-strong sm:text-5xl">{card.value}</span>
            )}
            <span aria-live="polite" className="w-full">
              {flipped ? (
                <span className="block border-t border-line pt-4">
                  {mode === "prompt" ? (
                    <span className="block text-4xl font-bold tabular-nums text-accent-strong sm:text-5xl">{card.value}</span>
                  ) : (
                    <span className="block text-lg leading-snug">{card.prompt}</span>
                  )}
                  <span className="mt-3 block text-xs text-muted">{card.source}</span>
                </span>
              ) : (
                <span className="text-sm text-muted">Nospied, lai pārbaudītu (vai atstarpe)</span>
              )}
            </span>
          </button>

          {flipped && (
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-secondary flex-1" onClick={() => answer(false)}>
                Vēl jāatkārto
              </button>
              <button type="button" className="btn-primary flex-1" onClick={() => answer(true)}>
                Zinu
              </button>
            </div>
          )}
          <p className="text-sm text-muted">
            Tēma:{" "}
            <Link href={`/tema/${slug(card.topic)}`} className="underline underline-offset-2">
              {card.topic} {topicTitles[card.topic]}
            </Link>
          </p>
          <p className="hidden text-sm text-muted sm:block">Taustiņi: atstarpe — apgriezt, → — zinu, ← — vēl jāatkārto.</p>
        </section>
      ) : null}
    </div>
  );
}
