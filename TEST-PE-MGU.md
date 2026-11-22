# Ambient Drive 0.2.8 și Ambient Drive Service 0.2.6

Versiune de test pentru iDrive 7. Compatibilitatea pe G01 xDrive30i cu software 2026 și afișarea pictogramei în widgetul mic trebuie confirmate pe mașină.

## Instalare de pe stick

1. Extrage arhiva și copiază folderul `mgu-repo` la rădăcina stickului. Dacă ai deja alte surse USB, înlocuiește numai `mgu-repo/ambient-drive-test`.
2. Deschide MGU Store, actualizează **Ambient Drive Service** la **0.2.6** și **Ambient Drive** la **0.2.8**. Folosește Update pentru a păstra setările.
3. În Ambient Drive verifică bifa de activare și regulile salvate.

## Test pe G01 xDrive30i

1. Cu mașina staționată și iDrive pornit, lasă M/S pe STANDARD și alege culori diferite pentru Comfort, Sport și Eco Pro.
2. Schimbă modurile pe rând și verifică luminile din habitaclu.
3. Dacă luminile nu se schimbă, rulează comanda de diagnostic după fiecare mod și notează modul pe care l-ai selectat.

```sh
node /var/opt/dorin-ambient/current/client.js status
```

`modeSource` arată dacă valoarea FES a venit prin citire sau notificare. `manualSource` arată sursa ultimei valori M/S valide. `confirmedByReadback` indică dacă unitatea a confirmat culoarea cerută.

## Test pe G01 plug-in și Home

1. Verifică dacă modurile Sport, Comfort și Eco Pro își păstrează regulile și dacă M/S are prioritate când mașina îl raportează.
2. Deschide Home și testează widgetul **Ambient Drive** în ambele dimensiuni. Modul și starea rămân afișate ca text. Culoarea selectată ar trebui să apară ca pătrat. O combinație cu alb afișează ambele nuanțe.
3. Verifică că STANDARD și oprirea automatizării elimină pătratul vechi. Apasă widgetul pentru a redeschide setările.
4. Repetă testul după ce mașina intră în sleep. Verifică bifa și culorile salvate la revenire.
