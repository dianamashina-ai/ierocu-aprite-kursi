"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Check, LayoutDashboard, MessageSquarePlus, Pencil, X } from "lucide-react";
import { addNoteAction, notesForPathAction, setNoteStatusAction } from "@/app/actions/notes";
import { setAdminViewAction } from "@/app/actions/admin";

type Note = { id: string; selector: string; comment: string; reply: string | null };
type Box = { top: number; left: number; width: number; height: number };

const UI = "data-notes-ui";

/** Unikāls CSS ceļš līdz elementam (id vai tag:nth-of-type ķēde). */
function cssPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.body && parts.length < 14) {
    if (node.id) {
      parts.unshift(`#${CSS.escape(node.id)}`);
      break;
    }
    const tag = node.tagName.toLowerCase();
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    const same = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
    parts.unshift(same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(node) + 1})` : tag);
    node = parent;
  }
  return parts.join(" > ") || "body";
}

const docBox = (el: Element): Box => {
  const r = el.getBoundingClientRect();
  return { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height };
};

const isUi = (el: Element | null) => Boolean(el?.closest(`[${UI}]`));

/** Administratora režīms: noklikšķini uz elementa un atstāj piezīmi par dizainu. */
export function NotesOverlay({ viewFull = false }: { viewFull?: boolean }) {
  const path = usePathname();
  const [active, setActive] = useState(false);
  const [hover, setHover] = useState<Box | null>(null);
  const [picked, setPicked] = useState<{ el: Element; box: Box } | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [openPin, setOpenPin] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(() => notesForPathAction(path).then(setNotes, () => setNotes([])), [path]);

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  useEffect(() => {
    setPicked(null);
    setOpenPin(null);
  }, [path]);

  // elementa izcelšana un izvēle
  useEffect(() => {
    if (!active) return;
    const move = (e: MouseEvent) => {
      const el = e.target as Element;
      if (picked || isUi(el)) return setHover(null);
      setHover(docBox(el));
    };
    const click = (e: MouseEvent) => {
      const el = e.target as Element;
      if (isUi(el)) return;
      e.preventDefault();
      e.stopPropagation();
      if (picked) return;
      setPicked({ el, box: docBox(el) });
      setHover(null);
      setText("");
      setTimeout(() => textRef.current?.focus(), 0);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (picked) setPicked(null);
        else setActive(false);
      }
    };
    const rerender = () => setTick((t) => t + 1);
    document.addEventListener("mousemove", move, true);
    document.addEventListener("click", click, true);
    document.addEventListener("keydown", key);
    window.addEventListener("resize", rerender);
    return () => {
      document.removeEventListener("mousemove", move, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", rerender);
    };
  }, [active, picked]);

  const save = async () => {
    if (!picked || !text.trim()) return;
    setSaving(true);
    try {
      await addNoteAction({
        path,
        selector: cssPath(picked.el),
        elementText: (picked.el as HTMLElement).innerText?.replace(/\s+/g, " ").trim().slice(0, 200) || picked.el.tagName.toLowerCase(),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        comment: text,
      });
      setPicked(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const markDone = async (id: string) => {
    await setNoteStatusAction(id, "done");
    setOpenPin(null);
    await load();
  };

  const pins = active
    ? notes
        .map((n, i) => {
          let el: Element | null = null;
          try {
            el = document.querySelector(n.selector);
          } catch {}
          return el ? { n, i, box: docBox(el) } : null;
        })
        .filter((p): p is { n: Note; i: number; box: Box } => p !== null)
    : [];
  const missing = active ? notes.length - pins.length : 0;

  return (
    <div {...{ [UI]: "" }}>
      {active && hover && (
        <div
          className="pointer-events-none absolute z-[60] rounded-sm outline-2 outline-offset-2 outline-dashed outline-accent"
          style={{ top: hover.top, left: hover.left, width: hover.width, height: hover.height }}
        />
      )}
      {active && picked && (
        <>
          <div
            className="pointer-events-none absolute z-[60] rounded-sm bg-accent/10 outline-2 outline-offset-2 outline-accent"
            style={{ top: picked.box.top, left: picked.box.left, width: picked.box.width, height: picked.box.height }}
          />
          <div
            className="absolute z-[70] w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line bg-white p-3 shadow-2xl"
            style={{
              top: picked.box.top + picked.box.height + 10,
              left: Math.max(16, Math.min(picked.box.left, window.innerWidth - 16 - Math.min(352, window.innerWidth - 32))),
            }}
          >
            <label className="text-sm font-semibold" htmlFor="note-text">Kas jāmaina?</label>
            <textarea
              id="note-text"
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
              }}
              rows={3}
              className="mt-1.5 block w-full rounded-lg border border-line p-2 text-[15px]"
              placeholder="Piem.: lielāku virsrakstu, mazāk atstarpes…"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setPicked(null)} className="rounded-lg px-3 py-2 text-sm hover:bg-accent-soft">Atcelt</button>
              <button type="button" onClick={save} disabled={saving || !text.trim()} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "Saglabā…" : "Saglabāt"}
              </button>
            </div>
          </div>
        </>
      )}

      {pins.map(({ n, i, box }) => (
        <div key={n.id} className="absolute z-[65]" style={{ top: box.top - 12, left: box.left - 12 }}>
          <button
            type="button"
            onClick={() => setOpenPin(openPin === n.id ? null : n.id)}
            className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white shadow-lg ring-2 ring-white"
            aria-label={`Piezīme ${i + 1}`}
          >
            {i + 1}
          </button>
          {openPin === n.id && (
            <div className="mt-2 w-72 rounded-xl border border-line bg-white p-3 text-sm shadow-2xl">
              <p className="whitespace-pre-wrap">{n.comment}</p>
              {n.reply && <p className="mt-2 rounded-lg bg-surface p-2 text-muted">↳ {n.reply}</p>}
              <button type="button" onClick={() => markDone(n.id)} className="mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-ok hover:bg-ok-soft">
                <Check className="size-4" /> Izdarīts
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="notes-fab fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-2 print:hidden">
        {active && (
          <div className="rounded-xl bg-ink px-3 py-2 text-xs text-white shadow-lg">
            Noklikšķini uz elementa · Esc — iziet{missing > 0 ? ` · ${missing} piezīmes šeit nav redzamas` : ""}
            {" · "}
            <a href="/labojumi" className="underline">visi labojumi</a>
          </div>
        )}
        <Link
          href="/admin"
          aria-label="Administrēšana"
          title="Administrēšana"
          className="inline-flex size-12 items-center justify-center rounded-full border border-line bg-white text-ink shadow-xl hover:bg-surface"
        >
          <LayoutDashboard className="size-5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => {
            setActive((a) => !a);
            setPicked(null);
            setHover(null);
          }}
          aria-pressed={active}
          aria-label={active ? "Beigt labot" : "Labot"}
          title={active ? "Beigt labot" : "Labot"}
          className={`inline-flex size-12 items-center justify-center rounded-full text-white shadow-xl ${active ? "bg-ink" : "bg-accent"}`}
        >
          {active ? <X className="size-5" aria-hidden="true" /> : notes.length ? <MessageSquarePlus className="size-5" aria-hidden="true" /> : <Pencil className="size-5" aria-hidden="true" />}
        </button>
      </div>
      <div className="notes-fab fixed bottom-4 left-4 z-[80] print:hidden">
        <AccessViewToggle full={viewFull} />
      </div>
    </div>
  );
}

/** Administratoram: pārslēgt, kā redzēt vietni — ar pilnu piekļuvi vai tikai ar bezmaksas moduli. */
function AccessViewToggle({ full }: { full: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (view: "pilna" | "bezmaksas") =>
    start(async () => {
      await setAdminViewAction(view);
      router.refresh();
    });
  const btn = (on: boolean) =>
    `min-h-9 rounded-full px-3 text-xs font-semibold transition-colors ${on ? "bg-ink text-white" : "text-muted hover:text-ink"}`;
  return (
    <div
      role="group"
      aria-label="Skats kā lietotājam"
      className={`inline-flex items-center gap-1 rounded-full border border-line bg-white p-1 shadow-lg ${pending ? "opacity-60" : ""}`}
    >
      <button type="button" aria-pressed={full} disabled={pending} onClick={() => set("pilna")} className={btn(full)}>
        Pilna piekļuve
      </button>
      <button type="button" aria-pressed={!full} disabled={pending} onClick={() => set("bezmaksas")} className={btn(!full)}>
        Bez maksas
      </button>
    </div>
  );
}
