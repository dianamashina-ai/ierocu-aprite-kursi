"""Ģenerē content/explanations/README.md no content/explanations/M*.json.

    python3 -I scripts/explanations-report.py
"""
import glob
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXPL = os.path.join(ROOT, "content", "explanations")

mods = {}
for f in sorted(glob.glob(os.path.join(EXPL, "M*.json"))):
    mods[os.path.basename(f)[:-5]] = json.load(open(f, encoding="utf-8"))

def category(todo):
    if todo.startswith("Tehnisks"):
        return "Ieroču uzbūve un kļūmes — tehniska informācija, kuras tiesību aktos nav"
    if todo.startswith("Drošības"):
        return "Drošība rīkojoties ar ieroci — izjaukšana, salikšana, pielādēšana, izlādēšana"
    return "Procedūra, kas nav atrasta ne likumā, ne MK noteikumos"


rows, tot = [], [0, 0, 0, 0]
outdated, missing, partial = [], {}, []
for m, entries in mods.items():
    full = sum(1 for e in entries if e["explanation"] and "TODO" not in e["explanation"])
    part = [e["id"] for e in entries if e["explanation"] and "TODO" in e["explanation"]]
    none = [e for e in entries if not e["explanation"]]
    rows.append(f"| {m} | {len(entries)} | {full} | {len(part)} | {len(none)} |")
    for i, v in enumerate((len(entries), full, len(part), len(none))):
        tot[i] += v
    partial += part
    for e in none:
        missing.setdefault(category(e.get("todo", "")), []).append(e["id"])
    outdated += [e for e in entries if e.get("possibly_outdated")]

out = [
    "# Skaidrojumu melnraksti",
    "",
    "> Ģenerēts ar `python3 -I scripts/explanations-report.py` — nerediģēt ar roku.",
    "",
    "Visi skaidrojumi ir **melnraksti** (`draft`). Tie rakstīti **tikai** pēc `content/law/` tekstiem:",
    "Ieroču aprites likums, Krimināllikuma izvilkums un MK noteikumi Nr. 191, 202, 210, 211, 494 (redakciju datumi — failu sākumā).",
    "Katra atsauce tiek automātiski pārbaudīta — pantam vai punktam jābūt tekstā (`tests/explanations.test.ts`).",
    "",
    "Sēklošana (`npm run db:seed`) ieraksta skaidrojumus datubāzē tikai jautājumiem ar statusu `draft`; pārbaudītos (`reviewed`) nepārraksta.",
    "",
    "## Kopsavilkums",
    "",
    "| Modulis | Jautājumi | Skaidrojums | Daļējs (ar TODO) | Nav (TODO) |",
    "|---|---|---|---|---|",
    *rows,
    f"| **Kopā** | **{tot[0]}** | **{tot[1]}** | **{tot[2]}** | **{tot[3]}** |",
    "",
    "## Iespējams novecojis (atbilde no PDF nav mainīta)",
    "",
    *[f"- **Q{e['id']}** — {e['outdated_note']}" for e in outdated],
    "",
    "## Kāpēc daļai jautājumu nav skaidrojuma",
    "",
    *[f"- **{k}** ({len(v)}): {', '.join(map(str, v))}" for k, v in missing.items()],
    "",
    f"**Daļēji** ({len(partial)}): skaidrojums balstīts tiesību aktā, bet kāda atbildes detaļa tajā nav atrodama (apzīmēts ar «TODO» tekstā). Jautājumi: {', '.join(map(str, partial))}",
    "",
]
open(os.path.join(EXPL, "README.md"), "w", encoding="utf-8").write("\n".join(out))
