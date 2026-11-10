# Ambient Drive 0.2.6 — ce pui pe stick

1. Extrage `Ambient-Drive-0.2.6-Stick.zip`.
2. Copiază folderul **mgu-repo** direct la rădăcina stickului, nu ZIP-ul și nu încă un folder exterior.
3. Calea trebuie să fie:

```text
STICK/mgu-repo/ambient-drive-test/
  catalog.json
  ambient-drive.png
  dorin-ambient@0.2.5.tgz
  dorin_ambientdrive@0.2.6.tgz
```

4. Dacă ai vechiul folder `ambient-drive-test`, înlocuiește-l cu cel nou. Păstrează celelalte surse de pe stick.
5. Introdu stickul în mașină → MGU Store → USB. Actualizează/instalează **Ambient Drive Service0.2.5**, apoi **Ambient Drive0.2.6**. Store poate rezolva singur dependența. Urmează orice restart cerut de Store.
6. Deschide Ambient Drive. La prima instalare bifa este oprită; la actualizare se păstrează starea și culorile. Alege culorile și testează după TEST-PE-MGU.md.

Pentru o altă mașină este necesar iDrive7 cu lumini ambientale și MGU Store deja configurat, cu mgu-deploy≥0.7.11. Pachetele includ aplicația și serviciul; SDK-ul și interfețele native provin din unitatea mașinii. Acest stick nu instalează MGU Store sau accesul SSH.
