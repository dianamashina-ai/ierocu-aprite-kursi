# Tiesību aktu teksti

Mācību saturs (skaidrojumi, nodarbības) tiek rakstīts **tikai** pēc šiem failiem.
Teksts pārņemts no likumi.lv **bez izmaiņām**: pantu, daļu un punktu numuri, formulējumi
un grozījumu piezīmes ir oriģinālie. Mūsu pievienotās rindas sākas ar «⏳ [platformas piezīme]».

| Fails | Saturs | Redakcija | Lejupielādēts |
|---|---|---|---|
| [ieroču-aprites-likums.md](./ieroču-aprites-likums.md) | Ieroču aprites likums, pilns teksts | 21.10.2026.–30.11.2026. (spēkā esošā; ietver 24.09.2026. grozījumus) | 2026-11-19 |
| [ieroču-aprites-likums.redakcija-2026-12-01.md](./ieroču-aprites-likums.redakcija-2026-12-01.md) | Panti, kuru teksts mainās no 01.12.2026. (16., 71. pants) | uz 01.12.2026. (vēl nav spēkā) | 2026-11-19 |
| [ieroču-aprites-likums.redakcija-2030-01-01.md](./ieroču-aprites-likums.redakcija-2030-01-01.md) | Panti, kuru teksts mainās no 01.01.2030. (3.^1 un 21 pants) | uz 01.01.2030. (vēl nav spēkā) | 2026-11-19 |
| [krimināllikums-izvilkums.md](./krimināllikums-izvilkums.md) | Krimināllikums: III nodaļa (28.–34. p.), 121., 122., 128., 129. pants un 233., 233.^1, 234., 235., 236., 237. pants | 05.11.2026.–24.11.2026. (spēkā esošā) | 2026-11-19 |

### Ministru kabineta noteikumi (izdoti uz Ieroču aprites likuma pamata)

| Fails | Noteikumi | Redakcija |
|---|---|---|
| [mk-210-ierocu-un-municijas-aprite.md](./mk-210-ierocu-un-municijas-aprite.md) | Nr. 210 «Noteikumi par ieroču un munīcijas apriti» (glabāšana, nēsāšana, pārvadāšana, nodošana, realizēšana) | 30.10.2026.–31.12.2026.; atsevišķi atzīmēti punkti, kas mainās no 01.01.2027. |
| [mk-211-ierocu-atlaujas.md](./mk-211-ierocu-atlaujas.md) | Nr. 211 «Noteikumi par ieroču atļaujām un par ieroču izņemšanu un iznīcināšanu» | 13.04.2024.– (vēl nav pielāgoti likuma grozījumiem, kas stājās spēkā 21.10.2026.) |
| [mk-202-veselibas-parbaudes.md](./mk-202-veselibas-parbaudes.md) | Nr. 202 par veselības pārbaudēm un medicīniskajām pretindikācijām | sākotnējā redakcija |
| [mk-494-sautuves.md](./mk-494-sautuves.md) | Nr. 494 par šautuvēm, treniņšaušanu un drošību | 14.08.2025.– |
| [mk-191-kvalifikacijas-parbaudijums.md](./mk-191-kvalifikacijas-parbaudijums.md) | Nr. 191 par kvalifikācijas pārbaudījumu (40 jautājumi, 40 min, ≤ 4 kļūdas) | sākotnējā redakcija |

Visi lejupielādēti 2026-11-19. Ja noteikumi ir pretrunā ar likumu, noteicošais ir likums.

Avoti:
- https://likumi.lv/ta/id/305818-ierocu-aprites-likums
- https://likumi.lv/ta/id/88966-kriminallikums

## Kā atjaunot

```bash
mkdir -p /tmp/law && cd /tmp/law
curl -sSL -o ial-2026-10-21.html https://likumi.lv/ta/id/305818/redakcijas-datums/2026/10/21
curl -sSL -o ial-2026-12-01.html https://likumi.lv/ta/id/305818/redakcijas-datums/2026/12/01
curl -sSL -o ial-2030-01-01.html https://likumi.lv/ta/id/305818/redakcijas-datums/2030/01/01
curl -sSL -o kl.html https://likumi.lv/ta/id/88966-kriminallikums
for id in 307488 307504 341445 316509 313821; do curl -sSL -o mk$id.html https://likumi.lv/ta/id/$id; done
curl -sSL -o mk307488-2027-01-01.html https://likumi.lv/ta/id/307488/redakcijas-datums/2027/01/01
cd - && python3 -I scripts/build-law.py /tmp/law "$(date +%F)"
```

Ja iznāk jauna redakcija, `scripts/build-law.py` jāpielāgo datumi (failu nosaukumi un nākotnes redakcijas).
Skripts pats pārbauda, ka neviens oficiālā teksta paragrāfs nav pazudis.
Pēc atjaunošanas jāpārskata skaidrojumi, kas atsaucas uz mainītajiem pantiem.
