# Ambient Drive 0.2.6 — verificare pe mașină

Actualizează **Ambient Drive Service la0.2.5** și **Ambient Drive la0.2.6**, fără dezinstalare sau ștergerea setărilor. Pentru modificarea aceasta nu sunt necesare citiri sau comenzi noi în PuTTY. Testează cu mașina staționată.

1. Copiază `mgu-repo` din pachetul Stick la rădăcina stickului; înlocuiește doar vechiul `ambient-drive-test`. MGU Store → USB → actualizează ambele componente. Urmează restartul dacă Store îl cere.
2. Bifa și toate alegerile existente trebuie păstrate. Sport Plus trebuie să pornească de la vechea culoare Sport, inclusiv STANDARD.
3. Ordinea: Sport, Sport Plus, Sport Individual, Comfort, Adaptive, Eco Pro, Eco Pro Individual, M/S. Fiecare listă trebuie să rețină propria culoare, chip și previzualizare. Lista rămâne deschisă până la Back.
4. Alege culori diferite pentru Sport și Sport Plus. Modificarea uneia nu trebuie să o modifice pe cealaltă. Repetă pentru Individual, Comfort, Adaptive, Eco Pro și Eco Pro Individual.
5. Verifică fizic Sport → Comfort → Eco Pro → Sport, apoi mută maneta în M/S și revino în D. M/S are prioritate. STANDARD nu trebuie să trimită o culoare sau să preia regula altui mod.
6. Pe o mașină echipată cu Sport Plus/Individual/Adaptive, selectează efectiv fiecare mod și verifică lumina. G01 fără acel mod poate verifica selectorul și salvarea, nu aplicarea sa fizică. Dacă un mod este disponibil în mașină dar nu se identifică distinct, avem nevoie de o citire FES în acel mod.
7. Închide și redeschide aplicația: toate culorile trebuie să rămână distincte.
8. Verifică după sleep complet bifa și funcționarea automată înainte de deschiderea aplicației; repetă separat cu bifa oprită. Restartul serviciului testat local nu dovedește sleep/wake al mașinii.

Autor: **Dorin Dumitras**. Testele locale au trecut; confirmarea fizică a acestei versiuni și a modurilor suplimentare rămâne de făcut.
