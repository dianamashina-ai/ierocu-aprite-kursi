import type { ReactNode } from "react";
import { parseBlocks } from "@/lib/content/lesson-markdown";

/** **treknraksts** → <strong> (bez HTML ievietošanas) */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

export function LessonBody({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-4 leading-relaxed" lang="lv">
      {parseBlocks(markdown).map((b, i) => {
        switch (b.kind) {
          case "h":
            return <h3 key={i} className="pt-2 text-lg font-semibold">{b.text}</h3>;
          case "p":
            return <p key={i}>{inline(b.text)}</p>;
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-brand">
                {b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal space-y-1.5 pl-6 marker:font-semibold marker:text-accent-strong">
                {b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}
              </ol>
            );
          case "note": {
            const [title, ...rest] = b.lines;
            const items = rest.filter((l) => l.startsWith("- ")).map((l) => l.slice(2));
            const text = rest.filter((l) => !l.startsWith("- "));
            return (
              <aside key={i} className="rounded-xl border-l-4 border-brand bg-accent-soft p-4">
                <p className="font-semibold text-accent-strong">{inline(title)}</p>
                {text.map((t, j) => <p key={j} className="mt-1">{inline(t)}</p>)}
                {items.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {items.map((it, j) => <li key={j}>{inline(it)}</li>)}
                  </ul>
                )}
              </aside>
            );
          }
        }
      })}
    </div>
  );
}
