# Publicare Ambient Drive 0.2.6 / Service 0.2.5

Țintă: **dorindumitras/ambient-drive**. Sursa și linkul adăugate în Store rămân aceleași. Acest pachet este complet, dar nu se încarcă singur pe GitHub. Publică după testul noii versiuni pe mașină.

## 1. Codul sursă complet

Extrage pachetul GitHub-Complet. În repository → Code → ramura main → **Add file → Upload files**. Încarcă **conținutul** folderului `repository`, nu folderul exterior și nu ZIP-ul. Păstrează structura. GitHub permite cel mult100fișiere într-o încărcare, deci fă două:

1. Folderele **apps**, **native**, **kit** → Commit changes pe main.
2. Folderele **tools**, **tests**, **docs** și toate fișierele de la rădăcina `repository` → Commit changes pe main.

Fișierul ascuns `.gitignore` este inclus; adaugă linia `publication/` la cel existent dacă nu îl poți selecta din fereastra de încărcare. Nu omite celelalte fișiere de la rădăcină: README.md, BUILDING.md, INSTALL.md, TEST-PE-MGU.md, CHANGELOG.md, RELEASE-ARTIFACTS.json, mgu-repo.json, LICENSE, LICENSE.kit și ambient-drive.png. README-ul păstrează fotografiile publice existente. `source-manifest.json` enumeră toate fișierele sursă și hashurile lor; este un fișier de verificare din pachetul exterior.

## 2. Pachetele instalabile — obligatoriu în release-ul catalog

Deschide https://github.com/dorindumitras/ambient-drive/releases → release-ul cu tag **catalog** → Edit. Lucrează în zona **Assets**.

Din folderul `release-assets`, adaugă:

- `dorin-ambient@0.2.5.tgz`
- `dorin_ambientdrive@0.2.6.tgz`
- `Ambient-Drive-0.2.6-source.zip`

Păstrează `ambient-drive.png` existent — este identic cu cel inclus. Dacă lipsește, încarcă-l și pe el. Pachetele și sursele vechilor versiuni pot rămâne atașate.

**După ce noile arhive s-au încărcat**, în aceeași editare, înlocuiește assetul `catalog.json` existent cu **catalog.json din release-assets**. GitHub nu permite două assets cu același nume: elimină vechiul catalog.json din Assets, apoi atașează noul fișier. Nu folosi catalog.json din folderul pentru stick: acela are adrese relative.

Pune în descriere textul din `RELEASE-NOTES.md` și apasă **Update release**. Release-ul catalog trebuie să rămână public, publicat normal, fără Draft sau Pre-release. Nu șterge, nu redenumi și nu muta tagul catalog. Publicarea unui alt tag fără actualizarea acestui catalog nu schimbă sursa Releases care îl citește.

## 3. Verificare după publicare

Deschide https://github.com/dorindumitras/ambient-drive/releases/download/catalog/catalog.json. Trebuie să descarce un JSON schema2 cu:

- `dorin_ambientdrive`, versiunea `0.2.6`, requires `dorin-ambient: 0.2.5`;
- `dorin-ambient`, versiunea `0.2.5`;
- ambele URL-uri sub `https://github.com/dorindumitras/ambient-drive/releases/download/catalog/`.

Descarcă cele două tgz-uri din adresele JSON. Dimensiunile și SHA256 trebuie să corespundă `CHECKSUMS.json` / `RELEASE-ARTIFACTS.json`. Arhiva `Ambient-Drive-0.2.6-source.zip` conține toate sursele, inclusiv kit, tools și tests. GitHub mai afișează automat Source code (zip/tar.gz) pentru commitul tagului catalog; pentru sursele complete ale acestei versiuni folosește arhiva cu numele explicit sau main. Opțional creează tagul v0.2.6 după încărcarea tuturor surselor.

## 4. Utilizatorii

Cei care au deja sursa: MGU Store → **Check now** → Ambient Drive → **Update**. Dependența noului serviciu este inclusă. Nu trebuie să adauge alt link.

Utilizator nou: Settings → Add source → **dorindumitras/ambient-drive** → **Releases** → Check now → Ambient Drive → Install. Nu este necesar token pentru acest repository public.

Adăugarea sursei este individuală; apariția în lista implicită a tuturor utilizatorilor depinde în continuare de acceptarea sursei de către administratorii MGU Store.

Pachetul a fost verificat local cu cititorul oficial Store și conține tot ce trebuie publicat. Descărcarea reală a noilor URL-uri poate fi confirmată numai după încărcarea fișierelor. Funcționarea pe o altă mașină se validează fizic.
