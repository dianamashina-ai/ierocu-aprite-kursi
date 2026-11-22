const LV_FROM = "āčēģīķļņšūž";
const LV_TO = "acegiklnsuz";

/** mazie burti bez garumzīmēm; garums nemainās (katrs burts → viens burts) */
export function foldLvSameLength(s: string) {
  let out = "";
  for (const ch of s) {
    const l = ch.toLowerCase();
    const i = LV_FROM.indexOf(l);
    out += l.length === 1 ? (i >= 0 ? LV_TO[i] : l) : ch;
  }
  return out;
}

/**
 * Sadala tekstu daļās, atzīmējot vietas, kur sākas kāda no saknēm (līdz vārda beigām).
 * Saknes jau ir “salocītas” (bez garumzīmēm, mazie burti).
 */
export function highlightParts(text: string, stems: string[]): { text: string; hit: boolean }[] {
  if (!stems.length || !text) return [{ text, hit: false }];
  const chars = Array.from(text);
  const folded = Array.from(foldLvSameLength(text));
  const hit = new Array<boolean>(chars.length).fill(false);
  const f = folded.join("");
  // indeksi pēc koda punktiem: pārvēršam virknes pozīciju uz masīva indeksu
  const posToIdx: number[] = [];
  let pos = 0;
  folded.forEach((c, i) => {
    for (let k = 0; k < c.length; k++) posToIdx[pos + k] = i;
    pos += c.length;
  });
  const isLetter = (c: string | undefined) => !!c && /[\p{L}\p{N}]/u.test(c);
  for (const st of stems) {
    if (!st) continue;
    let from = 0;
    for (;;) {
      const at = f.indexOf(st, from);
      if (at === -1) break;
      let i = posToIdx[at];
      // tikai vārda sākumā
      if (!isLetter(chars[i - 1])) {
        while (i < chars.length && isLetter(chars[i])) hit[i++] = true;
      }
      from = at + st.length;
    }
  }
  const parts: { text: string; hit: boolean }[] = [];
  chars.forEach((c, i) => {
    const last = parts[parts.length - 1];
    if (last && last.hit === hit[i]) last.text += c;
    else parts.push({ text: c, hit: hit[i] });
  });
  return parts;
}
