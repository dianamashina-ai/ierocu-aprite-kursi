/** Nodarbību vienkāršā markdown sadalīšana blokos (bez HTML). */
export type Block =
  | { kind: "h"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "note"; lines: string[] };

export function parseBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of md.split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trimEnd()).filter(Boolean);
    if (!lines.length) continue;
    if (lines[0].startsWith("## ")) {
      blocks.push({ kind: "h", text: lines[0].slice(3) });
      lines.shift();
      if (!lines.length) continue;
    }
    if (lines.every((l) => l.startsWith(">"))) blocks.push({ kind: "note", lines: lines.map((l) => l.replace(/^>\s?/, "")) });
    else if (lines.every((l) => l.startsWith("- "))) blocks.push({ kind: "ul", items: lines.map((l) => l.slice(2)) });
    else blocks.push({ kind: "p", text: lines.join(" ") });
  }
  return blocks;
}
