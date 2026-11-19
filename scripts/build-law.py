#!/usr/bin/env python3
"""
Saliek content/law/*.md no lejupielādētām likumi.lv lapām (skat. content/law/README.md).

  python3 -I scripts/build-law.py <dir-ar-html> <lejupielādes datums YYYY-MM-DD>

Gaida failus: ial-2026-10-21.html, ial-2026-12-01.html, ial-2030-01-01.html, kl.html
Oficiālais teksts netiek mainīts. Mūsu piezīmes ir atzīmētas ar «⏳ [platformas piezīme]».
"""
import importlib.util
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("law2md", os.path.join(HERE, "law-to-md.py"))
law = importlib.util.module_from_spec(spec)
spec.loader.exec_module(law)

SRC, DOWNLOADED = sys.argv[1], sys.argv[2]
OUT = os.path.join(HERE, "..", "content", "law")
IAL_URL = "https://likumi.lv/ta/id/305818-ierocu-aprites-likums"
KL_URL = "https://likumi.lv/ta/id/88966-kriminallikums"


def read(name):
    return open(os.path.join(SRC, name), encoding="utf-8").read()


def key(a):
    return (a["pfx"], a["num"] or a["paras"][0]["text"])


def title(a):
    return a["paras"][0]["text"].replace("**", "")


def body(a):
    return [p["text"] for p in a["paras"] if p["kind"] != "note"]


def edition_label(page):
    e = law.edition(page)
    return law.clean(e["label"]).replace("  ", " ") if e else "nezināma"


def write(name, text):
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(text.rstrip() + "\n")
    print("→", os.path.join("content/law", name))


# ── Ieroču aprites likums ─────────────────────────────────────
cur_page = read("ial-2026-10-21.html")
cur = law.articles(cur_page)
futures = [
    ("2026-12-01", "01.12.2026.", law.articles(read("ial-2026-12-01.html"))),
    ("2030-01-01", "01.01.2030.", law.articles(read("ial-2030-01-01.html"))),
]
cur_by = {key(a): a for a in cur if a["kind"] == "article"}

changes = {}  # key → [(iso, label)]
future_files = []
for iso, label, items in futures:
    fut_by = {key(a): a for a in items if a["kind"] == "article"}
    changed = [k for k in fut_by if k not in cur_by or body(fut_by[k]) != body(cur_by[k])]
    removed = [k for k in cur_by if k not in fut_by]
    for k in changed + removed:
        changes.setdefault(k, []).append((iso, label))
    parts = [
        f"# Ieroču aprites likums — redakcija uz {label}",
        "",
        f"- **Avots:** {IAL_URL}/redakcijas-datums/{iso.replace('-', '/')}",
        f"- **Lejupielādēts:** {DOWNLOADED}",
        f"- **Statuss:** vēl nav spēkā (stāsies spēkā {label}). Šeit ir **tikai panti, kuru teksts šajā redakcijā atšķiras** no spēkā esošās redakcijas (21.10.2026.).",
        "- Pilnais spēkā esošais teksts: [ieroču-aprites-likums.md](./ieroču-aprites-likums.md)",
        "",
        "> Teksts pārņemts no likumi.lv bez izmaiņām. Mācību saturā šīs normas drīkst minēt tikai ar norādi, ka tās stāsies spēkā vēlāk.",
        "",
    ]
    for k in changed:
        parts += ["---", "", law.to_markdown(fut_by[k]), ""]
    for k in removed:
        parts += ["---", "", f"### {title(cur_by[k])}", "", f"_Šajā redakcijā pants vairs nav iekļauts._", ""]
    fname = f"ieroču-aprites-likums.redakcija-{iso}.md"
    future_files.append((label, fname, changed + removed))
    write(fname, "\n".join(parts))

lines = [
    "# Ieroču aprites likums",
    "",
    f"- **Avots:** {IAL_URL}",
    f"- **Redakcija:** {edition_label(cur_page)} (redakcija uz 21.10.2026., ietver 24.09.2026. grozījumus, kas stājās spēkā 21.10.2026.)",
    f"- **Lejupielādēts:** {DOWNLOADED}",
    "- **Izdevējs:** Saeima · Pieņemts 14.03.2019. · Stājas spēkā 10.04.2019. · Publicēts: Latvijas Vēstnesis, 61, 27.03.2019.",
    "",
    "> Oficiālais teksts pārņemts no likumi.lv **bez izmaiņām** (pantu, daļu un punktu numuri, formulējumi, grozījumu piezīmes).",
    "> Rindas, kas sākas ar «⏳ [platformas piezīme]», pievienojām mēs — tās norāda uz normām, kas stāsies spēkā vēlāk.",
    "",
    "## Normas, kas stāsies spēkā vēlāk",
    "",
    "| Pants | Mainās no | Jaunā redakcija |",
    "|---|---|---|",
]
for k, dates in changes.items():
    a = cur_by.get(k)
    name = title(a) if a else k[1]
    links = ", ".join(f"[{lbl}](./ieroču-aprites-likums.redakcija-{iso}.md)" for iso, lbl in dates)
    lines.append(f"| {name} | {', '.join(l for _, l in dates)} | {links} |")
lines += ["", "Precīzu apjomu (kura daļa vai vārdi mainās) skat. pantu grozījumu piezīmēs zemāk un pārejas noteikumos.", "", "---", ""]

for item in cur:
    if item["kind"] == "heading":
        lines += [f"## {item['text']}", ""] + ([f"> {item['note']}", ""] if item.get("note") else [])
        continue
    if item["kind"] == "closing":
        lines += [item["text"], ""]
        continue
    lines += [law.to_markdown(item), ""]
    k = key(item)
    if k in changes:
        when = " un ".join(f"[{lbl}](./ieroču-aprites-likums.redakcija-{iso}.md)" for iso, lbl in changes[k])
        lines += [f"> ⏳ [platformas piezīme] Šī panta teksts mainās no {when}. Līdz tam ir spēkā augstāk redzamā redakcija.", ""]
write("ieroču-aprites-likums.md", "\n".join(lines))

# Pārbaude: neviens oficiālā teksta paragrāfs nav pazudis
md = open(os.path.join(OUT, "ieroču-aprites-likums.md"), encoding="utf-8").read()
missing = [p["text"] for a in cur if a["kind"] == "article" for p in a["paras"] if p["text"].replace("**", "") not in md.replace("**", "")]
assert not missing, f"Pazuduši paragrāfi: {missing[:3]}"

# ── Krimināllikums (izvilkums) ────────────────────────────────
kl_page = read("kl.html")
kl = law.articles(kl_page)
WANT_III = {"28", "29", "30", "31", "32", "33", "34"}
WANT_WEAPONS = ["233", "233_1", "234", "235", "236", "237"]
# Nepieciešamās aizstāvēšanās / aizturēšanas robežu pārkāpšana
WANT_LIMITS = {"XII nodaļa": ["121", "122"], "XIII nodaļa": ["128", "129"]}
chapter = ""
sel_iii, sel_w, sel_lim = [], {}, {}
for item in kl:
    if item["kind"] == "heading":
        chapter = item["text"]
        continue
    if item["kind"] != "article" or item["pfx"] != "p":
        continue
    if chapter.startswith("III nodaļa") and item["num"] in WANT_III:
        sel_iii.append(item)
    if chapter.startswith("XX nodaļa") and item["num"] in WANT_WEAPONS:
        sel_w[item["num"]] = item
    for ch, nums in WANT_LIMITS.items():
        if chapter.startswith(ch) and item["num"] in nums:
            sel_lim[item["num"]] = (chapter, item)
assert len(sel_iii) == 7 and len(sel_w) == len(WANT_WEAPONS), (len(sel_iii), list(sel_w))
assert sorted(sel_lim) == ["121", "122", "128", "129"], list(sel_lim)

kl_lines = [
    "# Krimināllikums — izvilkums",
    "",
    f"- **Avots:** {KL_URL}",
    f"- **Redakcija:** {edition_label(kl_page)}",
    f"- **Lejupielādēts:** {DOWNLOADED}",
    "- **Izdevējs:** Saeima · Pieņemts 17.06.1998. · Stājas spēkā 01.04.1999.",
    "",
    "> Tikai panti, kas vajadzīgi kvalifikācijas pārbaudījuma tēmām. Teksts pārņemts no likumi.lv **bez izmaiņām**.",
    "> Iekļauts: III nodaļa (28.–34. pants); 121., 122., 128., 129. pants (nepieciešamās aizstāvēšanās un aizturēšanas",
    "> nosacījumu pārkāpšana); XX nodaļas panti par nelikumīgu darbību ar šaujamieročiem un munīciju.",
    "",
    "## III nodaļa — Apstākļi, kas izslēdz kriminālatbildību",
    "",
]
for a in sel_iii:
    kl_lines += [law.to_markdown(a), ""]
last_ch = None
for n in ["121", "122", "128", "129"]:
    ch, a = sel_lim[n]
    if ch != last_ch:
        kl_lines += [f"## {ch} (izvilkums)", ""]
        last_ch = ch
    kl_lines += [law.to_markdown(a), ""]
kl_lines += ["## XX nodaļa — Noziedzīgi nodarījumi pret vispārējo drošību un sabiedrisko kārtību (izvilkums)", ""]
for n in WANT_WEAPONS:
    kl_lines += [law.to_markdown(sel_w[n]), ""]
write("krimināllikums-izvilkums.md", "\n".join(kl_lines))

# ── Ministru kabineta noteikumi ───────────────────────────────
MK_DOCS = [
    # (fails, id, īsais nosaukums, nākotnes redakcijas fails vai None)
    ("mk307488.html", "307488", "mk-210-ierocu-un-municijas-aprite", ("mk307488-2027-01-01.html", "01.01.2027.")),
    ("mk307504.html", "307504", "mk-211-ierocu-atlaujas", None),
    ("mk341445.html", "341445", "mk-202-veselibas-parbaudes", None),
    ("mk316509.html", "316509", "mk-494-sautuves", None),
    ("mk313821.html", "313821", "mk-191-kvalifikacijas-parbaudijums", None),
]


def passport(page):
    i = page.find("Tiesību akta pase")
    p = re.sub(r"\s+", " ", law.clean(re.sub(r"<[^>]+>", " ", page[i : i + 3000])))
    get = lambda k, pat=r"(\S+)": (re.search(k + r": " + pat, p) or [None, ""])[1].strip()
    return {"nosaukums": law.clean(re.search(r"<div class='TV207'[^>]*>(.*?)</div>", page, re.S).group(1)),
            "numurs": get("Numurs"), "pieņemts": get("Pieņemts"), "spēkā": get("Stājas spēkā"),
            "publicēts": get("Publicēts", r"(.*?) OP")}


def mk_point_md(item):
    # MK noteikumu punkts: virsrakstā tikai numurs (meklēšanai), zem tā — oriģinālais teksts bez izmaiņām
    first = item["paras"][0]["text"]
    num = re.match(r"\*?\*?(\d+)\.(\^\d+)?", first)
    head = f"### {num.group(1)}.{num.group(2) or ''}" if num else "###"
    body = []
    for p in item["paras"]:
        if p["kind"] == "note":
            body.append(f"> {p['text']}")
        elif p["kind"] == "l2":
            body.append(f"- {p['text']}")
        elif p["kind"] == "l3":
            body.append(f"  - {p['text']}")
        else:
            body.append(p["text"])
    return head + "\n\n" + "\n\n".join(body)



for fname, doc_id, slug, future in MK_DOCS:
    page = read(fname)
    pas = passport(page)
    items = law.articles(page)
    fut_changes = {}
    if future:
        fut_items = law.articles(read(future[0]))
        cur_by = {i["paras"][0]["text"][:12]: i for i in items if i["kind"] == "article"}
        for fi in fut_items:
            if fi["kind"] != "article":
                continue
            k = fi["paras"][0]["text"][:12]
            if k not in cur_by or body(cur_by[k]) != body(fi):
                fut_changes[k] = fi
    lines = [
        f"# {pas['nosaukums']}",
        "",
        f"- **Ministru kabineta noteikumi Nr. {pas['numurs']}** · Pieņemti {pas['pieņemts']} · Stājas spēkā {pas['spēkā']} · Publicēts: {pas['publicēts']}",
        f"- **Avots:** https://likumi.lv/ta/id/{doc_id}",
        f"- **Redakcija:** {edition_label(page) if law.edition(page) else 'sākotnējā redakcija (grozījumu nav)'}",
        f"- **Lejupielādēts:** {DOWNLOADED}",
        "",
        "> Teksts pārņemts no likumi.lv **bez izmaiņām**. Ja noteikumi ir pretrunā ar likumu (piem., pēc likuma grozījumiem, kas stājās spēkā 21.10.2026.), noteicošais ir likums.",
        "> Rindas, kas sākas ar «⏳ [platformas piezīme]», pievienojām mēs.",
        "",
    ]
    if fut_changes:
        lines += [f"## Punkti, kas mainās no {future[1]}", "",
                  f"Avots: https://likumi.lv/ta/id/{doc_id}/redakcijas-datums/{future[0].split('-',1)[1][:10].replace('-','/')}", ""]
        for fi in fut_changes.values():
            lines += [mk_point_md(fi), ""]
        lines += ["---", ""]
    for it in items:
        if it["kind"] == "heading":
            lines += [f"## {it['text']}", ""] + ([f"> {it['note']}", ""] if it.get("note") else [])
        elif it["kind"] == "closing":
            lines += [it["text"], ""]
        else:
            lines += [mk_point_md(it), ""]
            if it["paras"][0]["text"][:12] in fut_changes:
                lines += [f"> ⏳ [platformas piezīme] Šis punkts mainās no {future[1]} — skat. sadaļu augšā.", ""]
    write(f"{slug}.md", "\n".join(lines))
    md = open(os.path.join(OUT, f"{slug}.md"), encoding="utf-8").read().replace("**", "")
    miss = [p["text"] for a in items if a["kind"] == "article" for p in a["paras"] if p["text"].replace("**", "") not in md]
    assert not miss, f"{slug}: pazuduši paragrāfi {miss[:2]}"
