/** Moduļu īsie apraksti un ikonas kursa lapai (teksts — tikai tas, kas ir moduļa tēmās). */
export const MODULE_META: Record<string, { icon: ModuleIcon; description: string }> = {
  M1: { icon: "cog", description: "Šaujamieroča un munīcijas jēdzieni, veidi, mehānismi un kļūmes šaujot." },
  M2: { icon: "shield", description: "Droša rīcība ar ieroci: izjaukšana, salikšana, pielādēšana un izlādēšana." },
  M3: { icon: "list", description: "Ieroču kategorijas, lietojuma veidi un aizliegumi fiziskajām personām." },
  M4: { icon: "badge", description: "Kad vajadzīga atļauja, vecuma prasības, atļauju veidi un to anulēšana." },
  M5: { icon: "vault", description: "Ieroča iegāde, īpašnieka pienākumi un glabāšana mājās un ceļā." },
  M6: { icon: "route", description: "Pārvadāšana, nēsāšana, ieroča nodošana, šautuves un realizācija." },
  M7: { icon: "globe", description: "Ar ieroci uz citām valstīm, iegāde ārvalstīs un robežas šķērsošana." },
  M8: { icon: "target", description: "Izmantošana un pielietošana, galējais līdzeklis, brīdināšana un rīcība pēc šāviena." },
  M9: { icon: "scale", description: "Valsts policijas kontrole, administratīvā un kriminālatbildība." },
};

export type ModuleIcon = "cog" | "shield" | "list" | "badge" | "vault" | "route" | "globe" | "target" | "scale";
