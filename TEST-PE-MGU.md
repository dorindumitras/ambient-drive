# Test Home — Ambient Drive0.2.7 / Service0.2.5

Această versiune se bazează pe0.2.6 și adaugă widgetul Home. Serviciul, regulile de culoare și setările persistente sunt aceleași. Versiune de test publicată la cererea utilizatorului; confirmarea fizică a widgetului și sleep/wake nu este încă înregistrată.

## Instalare

1. Extrage Ambient-Drive-0.2.7-Widget-Test-Stick.zip. Copiază mgu-repo la rădăcina stickului; înlocuiește numai folderul ambient-drive-test vechi.
2. MGU Store → USB → Ambient Drive → Update la0.2.7. Serviciul necesar rămâne0.2.5 și este inclus. Nu dezinstala și nu șterge setările. Urmează orice restart cerut de Store.
3. Deschide aplicația o dată: bifa și culorile trebuie păstrate, iar meniul/selectoarele/previzualizarea trebuie să funcționeze ca înainte.

## Widgetul

1. În Home, deschide personalizarea paginii și lista Adaugă widget. Trebuie să apară Ambient Drive, cu pictograma aprobată.
2. Adaugă-l și verifică dimensiunea mică: modul detectat, culoarea setată, starea automatizării.
3. Mărește-l: verifică aceleași texte și ilustrația discretă cu luminile din față și de pe laterale. Culorile combinate trebuie să aibă și linie albă. Fotografiază ambele dimensiuni, pentru verificarea pozițiilor și încadrării pe HMI.
4. Atinge widgetul: trebuie să deschidă meniul Ambient Drive. Revino pe Home.
5. Cu mașina staționată, în READY, verifică Sport → Comfort → Eco Pro. Widgetul trebuie să arate modul și culoarea regulii după primirea datelor, de obicei în1–2secunde. Verifică separat M/S numai când poate fi selectat staționar.
6. Alege o altă culoare și o variantă cu Alb în aplicație; revino Home și verifică textul/ilustrația. STANDARD trebuie afișat ca STANDARD și nu trebuie să trimită o comandă de culoare.
7. Oprește bifa în aplicație și revino pe Home: apare Oprit, fără un mod/culoare veche prezentate ca actuale. Atingerea widgetului trebuie doar să deschidă aplicația, fără să pună bifa.
8. Schimbă limba iDrive și verifică textele native din widget și meniurile existente. Numele de marcă Ambient Drive rămâne identic.
9. Navighează pe altă pagină Home, revino, redimensionează, elimină și adaugă widgetul din nou. Datele trebuie să reapară fără pictograme sau imagini blocate.
10. Verifică după repornirea unității și, separat, după sleep complet: widgetul și alegerile trebuie păstrate de platformă. Aceste verificări fizice nu sunt încă efectuate.

## Interpretarea stării

- Activ: ultima aplicare raportată de serviciu este confirmată și corespunde regulii afișate. Culoarea afișată este cea configurată, nu o măsurare independentă a LED-urilor.
- Așteaptă date: modul sau datele necesare nu sunt disponibile. Nu trebuie afișat artificial Sport/Comfort sau o culoare veche ca fiind actuală.
- Neconfirmat / Se aplică / Lumini oprite: starea respectivă este raportată fără confirmare falsă.
- Fără conexiune: aplicația nu poate citi serviciul.
- STANDARD: regula păstrează culoarea, fără fallback la alt mod.

Problema M/S de pe G01 xDrive30i cu software2026 rămâne separată: acest pachet păstrează serviciul0.2.5 și nu introduce un semnal alternativ neverificat. Pe acea mașină widgetul poate arăta Așteaptă date.

Trimite fotografii cu widgetul mic și mare și rezultatele punctelor de mai sus. Dacă nu apare în lista Home sau nu se actualizează, trimite mesajul exact și logul aplicației; nu este necesară reinstalarea repetată înaintea analizei.
