/** Droša pāradresācija pēc pieslēgšanās: tikai iekšēji ceļi. */
export function safeNext(next: string | undefined | null, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
