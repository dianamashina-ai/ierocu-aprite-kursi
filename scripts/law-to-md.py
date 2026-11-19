#!/usr/bin/env python3
"""
likumi.lv tiesību akta HTML → Markdown (teksts netiek mainīts: pantu, daļu un punktu numuri,
formulējumi un grozījumu piezīmes saglabājas kā oriģinālā).

Lietošana (palaist ar `python3 -I`, HTML ir nepārbaudīti dati):
  python3 -I scripts/law-to-md.py articles <fails.html>          — JSON: visi panti
  python3 -I scripts/law-to-md.py edition  <fails.html>          — attēlotā redakcija

Pašu Markdown failu salikšanu dara scripts/build-law.py.
"""
import html
import json
import re
import sys
from html.parser import HTMLParser


def clean(fragment: str) -> str:
    """HTML fragments → teksts ar **treknrakstu**; saites tiek aizstātas ar to tekstu."""
    t = re.sub(r"<br\s*/?>", " ", fragment, flags=re.I)
    t = re.sub(r"</?b>", "**", t, flags=re.I)
    t = re.sub(r"<sup>(.*?)</sup>", r"^\1", t, flags=re.I | re.S)
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t).replace("\xa0", " ")
    t = re.sub(r"[ \t]+", " ", t).strip()
    t = re.sub(r"\*\*(\s+)\*\*", r"\1", t)  # "</B> <B>" → atstarpe saglabājas
    t = t.replace("****", "")
    return t


def edition(page: str):
    m = re.search(r'"selected":\{"value":"([^"]+)","content":"(.*?)"\}', page)
    if not m:
        return None
    content = json.loads('"' + m.group(2) + '"')
    return {"value": m.group(1), "label": clean(content)}


def doc_body(page: str) -> str:
    i = page.find("<div class=\"doc-body\">")
    if i == -1:
        raise SystemExit("doc-body nav atrasts")
    # dokumenta beigas: pirms paraksta / saistīto dokumentu bloka
    j = len(page)
    for marker in ("<div class='doc-footer", '<div class="doc-footer'):
        k = page.find(marker, i)
        if k != -1:
            j = min(j, k)
    return page[i:j]


def articles(page: str):
    """Atgriež sarakstu: {kind: heading|article|other, ...} dokumenta secībā."""
    body = doc_body(page)
    out = []
    # nodaļu virsraksti un panti/punkti ir top-level div ar klasēm TV212 / TV213 / TV206 / TV207
    # klasei var būt papildu vārdi (piem. 'TV213 w-sc-court w-any-court' pantiem ar tiesu praksi)
    for m in re.finditer(r"<div class='(TV\d\d\d)[^']*'([^>]*)>(.*?)(?=<div class='TV\d\d\d|\Z)", body, re.S):
        cls, attrs, inner = m.group(1), m.group(2), m.group(3)
        if cls in ("TV212", "TV214", "TV403"):
            # nodaļa / «Pārejas noteikumi» / «Informatīva atsauce uz ES direktīvām»
            head = inner.split("</div>")[0]
            note = re.search(r"<p class='labojumu_pamats'>(.*?)</p>", head, re.S)
            head = re.sub(r"<p class='labojumu_pamats'>.*?</p>", "", head, flags=re.S)
            out.append({"kind": "heading", "text": clean(re.sub(r"<br\s*/?>", " — ", head)), "note": clean(note.group(1)) if note else None})
            continue
        if cls in ("TV215", "TV216", "TV217"):
            # noslēgums: pieņemšanas datums, paraksts, vieta un datums
            t = clean(inner.split("</div>")[0])
            if t:
                out.append({"kind": "closing", "text": t})
            continue
        if cls not in ("TV213", "TV208"):
            continue
        num = re.search(r'data-num="([^"]*)"', attrs)
        pfx = re.search(r"data-pfx='([^']*)'", attrs)
        # izmetam pantu piezīmju/tiesu prakses ikonu blokus (tiem nav teksta)
        inner = re.sub(r"<div class='info-icon-wrapper'>.*?</div>\s*</div>", "", inner, flags=re.S)
        paras = []
        for p in re.finditer(r"<p class=['\"]([^'\"]+)['\"][^>]*>(.*?)</p>", inner, re.S):
            pcls, ptext = p.group(1), clean(p.group(2))
            if not ptext:
                continue
            if "court-hide" in pcls or "court" in pcls.split():
                continue
            kind = (
                "title" if "TVP" in pcls
                else "note" if pcls == "labojumu_pamats"
                else "l3" if "limenis3" in pcls
                else "l2" if "limenis2" in pcls
                else "text"
            )
            paras.append({"kind": kind, "text": ptext})
        if paras:
            out.append({"kind": "article", "num": num.group(1) if num else "", "pfx": pfx.group(1) if pfx else "", "paras": paras})
    return out


def to_markdown(item) -> str:
    lines = []
    for p in item["paras"]:
        if p["kind"] == "title":
            lines.append(f"### {p['text'].replace('**', '')}")
        elif p["kind"] == "note":
            lines.append(f"> {p['text']}")
        elif p["kind"] == "l2":
            lines.append(f"- {p['text']}")
        elif p["kind"] == "l3":
            lines.append(f"  - {p['text']}")
        else:
            lines.append(p["text"])
    return "\n\n".join(lines)


if __name__ == "__main__":
    cmd, path = sys.argv[1], sys.argv[2]
    page = open(path, encoding="utf-8").read()
    if cmd == "edition":
        print(json.dumps(edition(page), ensure_ascii=False))
    elif cmd == "articles":
        print(json.dumps(articles(page), ensure_ascii=False, indent=1))
