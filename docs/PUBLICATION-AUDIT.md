# Audit GitHub Ambient Drive — 9 noiembrie 2026

Repository verificat: https://github.com/dorindumitras/ambient-drive

## Rezultat

- Repository-ul public main are exact patru fișiere: LICENSE, LICENSE.kit, README.md și ambient-drive.png. Directoarele sursă apps, native, kit, tools și tests lipsesc.
- Release-ul catalog este public, cu tagul corect și fără marcaj pre-release. Catalogul, pictograma și cele două arhive se descarcă fără autentificare.
- Arhivele instalabile corespund exact versiunii locale: aplicație 0.2.5 și serviciu 0.2.4. Dimensiunile și hashurile sunt corecte.
- Cele 39 de module JavaScript din arhive sunt parsabile ca ES2017. Nu s-au găsit importuri relative fără fișier. Fișierele de pornire, unitatea serviciului, manifestele, controalele și cele 33 de locale sunt prezente.
- Cod JavaScript există în arhivele instalabile, însă proiectul complet care permite compilarea și testarea nu este publicat pe main.
- Arhiva automată Source code (zip) a release-ului catalog conține tot numai cele patru fișiere de prezentare. Acea arhivă este un snapshot al tagului, nu o extragere a codului din fișierele .tgz atașate.

## Corecția pregătită

Pachetul repository conține proiectul complet, testele active, kitul, licențele, documentația de instalare și compilare. README-ul păstrează cele trei imagini adăugate de utilizator și adaugă legăturile către surse.

O compilare din acest dosar curat a reprodus exact cele două arhive publice. Au trecut toate cele 14 verificări din tools/test.py. Detaliile hashurilor sunt în RELEASE-ARTIFACTS.json.

Host audit: Node v23.11.0, Python 3.13.5, Darwin.

Pachetele instalabile nu sunt modificate de această completare a surselor. Nu se schimbă versiunile aplicației sau serviciului.

## Limitele verificării

Nu a fost executat codul descărcat de pe GitHub; arhivele au fost inspectate static și comparate cu sursele locale. Testele locale folosesc date simulate și socketuri temporare, fără conectare la mașină. Sunt încă neconfirmate retestul fizic 0.2.5, sleep/wake complet și alte modele/firmware. Serviciul folosește modulele și configurațiile SOME/IP existente pe MGU; disponibilitatea lor trebuie validată pe o unitate nouă.

Cele trei URL-uri ale pozelor din README au fost păstrate. Verificarea lor prin cereri HTTP HEAD a primit 403 din mediul de audit, deci acest control nu stabilește dacă pozele sunt vizibile în browserul unui utilizator. Ele nu sunt dependențe ale instalării.

Nu s-a făcut nicio modificare la repository sau release prin acest audit. Sursele sunt pregătite local pentru încărcare.
