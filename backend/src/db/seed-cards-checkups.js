const db = require('./database');

console.log('Seeding action cards...');
const insertCard = db.prepare(`INSERT INTO action_cards (week_min,week_max,title,scenario,scientific_explanation,concrete_action,icon) VALUES (?,?,?,?,?,?,?)`);

const cards = [
  [4, 16, 'Mama wymiotuje — co robić?', 'Tato, słyszę jak mama ma mdłości. To przeze mnie — hormon hCG atakuje jej układ trawienny jak alarm. Ona to wytrzymuje. Ty możesz pomóc.', '1. Postaw przy jej łóżku nocnym szklankę wody i suche krakersy/herbatniki ryżowe. 2. Wyeliminuj z kuchni silne zapachy. 3. Kup imbir: herbata imbirowa lub cukierki.', 'Jeśli wymiotuje >3-4 razy dziennie i nie utrzymuje płynów, zadzwoń do lekarza (ryzyko hyperemesis gravidarum).', '🤢'],
  [20, 42, 'Mama nie może spać', 'Moja rosnąca macica, hormony i lęk przed porodem kradną mamie sen.', 'Zły sen mamy to wzrost kortyzolu — a kortyzol wpływa na mój rozwijający się mózg.', '1. Kup poduszkę ciążową kształtu \"C\" lub \"U\". 2. Masaż stóp i łydek po kolacji. 3. Ogranicz płyny po 19:00, żeby rzadziej wstawała do toalety.', '😴'],
  [4, 42, 'Mama jest rozdrażniona', 'Tato, to nie jest jej \"zły humor\". To progesteron, kortyzol, brak snu i hormonalny rollercoaster.', 'Rozdrażnienie w ciąży jest fizjologiczne, a nie interpersonalne. Wynika ze zmęczenia układu nerwowego.', 'Jedno zdanie, które działa: \"Wiem, że jest ciężko. Jestem tutaj.\" Nie oferuj gotowych rozwiązań. Słuchaj.', '😤'],
  [4, 42, 'Boję się o zdrowie dziecka', 'Strach o mnie jest normalny — jest biologicznie zaprojektowany, żebyś mnie chronił.', 'Lęk ojcowski wpływa na jakość relacji z partnerką i poziom Waszego stresu domowego.', 'Unikaj nocnych forów internetowych. Spisuj listę pytań i na wizycie pytaj bezpośrednio lekarza. Szukaj faktów, nie opinii.', '💔'],
  [36, 42, 'Idziemy na poród — co teraz?', 'Zaraz się poznamy. Twoja głowa jest pełna stresu i pytań — musisz przygotować plan logistyczny przed akcją.', 'Reguła 5-1-1: skurcze co 5 minut, każdy trwający 1 minutę, przez co najmniej 1 godzinę = czas na szpital.', 'Twoją rolą w szpitalu jest bycie przy niej. Trzymaj za rękę, nie dawaj rad lekarzom, dbaj o jej komfort i wodę.', '🏥'],
  [38, 42, 'Pierwsze godziny po porodzie', 'Tato, właśnie się urodziłem. Słyszę dźwięki, czuję zimno i ostre światło.', 'Słyszę Twój głos od 16. tygodnia i potrafię go rozpoznać. To daje mi ogromne ukojenie.', 'Skin-to-skin z tatą: weź mnie na klatkę piersiową jeśli mama nie może od razu. Poinformuj rodzinę z dużym opóźnieniem.', '👶'],
  [4, 42, 'Wykluczony z ciąży', 'Jesteś uczestnikiem czegoś, czego nie czujesz fizycznie na ciele. To może powodować zagubienie.', 'Paternal exclusion dotyka większości ojców w T1 i T2. Pamiętaj: biologicznie Twoja rola w budowie domu/zabezpieczenia jest w naszym instynkcie.', 'Wyspecjalizuj się w ciąży: logistyka, transport, żywienie, badania. Czytaj do mojego brzucha na głos – to buduje neuro-więź.', '😰'],
  [36, 42, 'Depresja u taty po porodzie', 'Depresja poporodowa dotyka nie tylko mamy. Jedno na 10 ojców w pierwszym roku życia dziecka doświadcza tego stanu.', 'Objawy to często: drażliwość, wycofanie, nadmierna praca, używki, rzadziej klasyczny smutek.', 'Rozmawiaj! Nie bądź cicho – powiedz mamie albo specjalistom. Istnieją telefony wsparcia dla ojców.', '🧠'],
  [4, 42, 'Zdrowie psychiczne mamy', 'Depresja prenatalna i poporodowa dotyka 10-20% kobiet.', 'To najczęstsza komplikacja ciążowa, ukryta pod maską \"to tylko hormony\" – wymaga wczesnej pomocy fachowej.', 'Nie mów: \"Inni mają gorzej\". Zapytaj: \"Jak się czujesz TY, nie jako mama, jako TY?\" Pokaż się jako oparcie dla leczenia.', '🤰']
];

const insertCards = db.transaction(() => {
  for (const c of cards) { insertCard.run(...c); }
});
insertCards();
console.log(`Inserted ${cards.length} action cards`);

console.log('Seeding checkups...');
const insertCheckup = db.prepare(`INSERT INTO checkups (week_number,name,description,what_it_means,questions_to_ask,is_mandatory) VALUES (?,?,?,?,?,?)`);

const checkups = [
  [8, 'Baseline i badania ogólne (Tyg. 8–10)', 'Morfologia, mocz, glukoza, TSH, grupa krwi, HIV, HBs, kiła.', 'Sprawdzenie bazowego stanu zdrowia mamy – czy nie ma ukrytych niedoborów lub infekcji.', 'Jak wyglądają wyniki badań? Co oznacza dla naszego dziecka?', 1],
  [12, 'USG genetyczne + PAPP-A (Tyg. 11–13)', 'Pomiar NT (przezierność karkowa) + PAPP-A + wolne β-hCG.', 'Ocena ryzyka najczęstszych trisomii: 21, 18, 13.', 'Jakie są sygnały alarmowe na które musimy w ogóle podczas ciąży uważać?', 1],
  [16, 'Amniopunkcja (Tyg. 15-20, jeśli wskazana)', 'Badanie inwazyjne lub np. wolnego płodowego DNA z krwi (NIPT).', 'Diagnostyka chromosomowa dająca ogromną pewność genetyczną płodu.', 'Czy wyniki są w normie? Czy potrzebne są dalsze konsultacje pod kątem genetyku?', 0],
  [20, 'USG morfologiczne (Tyg. 18–22)', 'USG połówkowe.', 'Ocena budowy każdej ważnej anatomii u płodu – kluczowe badanie sprawdzające czy rosnę bez wad.', 'Gdzie jest moje łożysko u mamy? Kiedy ustalać kolejne z cyklu?', 1],
  [24, 'Krzywa cukrowa OGTT (Tyg. 24–28)', 'Diagnostyka cukrzycy ciążowej 75 g glukozy.', 'Jeden z krytycznych testów – cukrzyca wyzwala wiele negatywnych lawin zdrowotnych.', 'Co robimy jeśli wynik krzywej cukrowej OGTT wyjdzie nieprawidłowy?', 1],
  [30, 'USG wzrostowe (Tyg. 28–32)', 'Monitoring i ocena ogólnego wzrastania, ilości samych wód płodowych, sprawności wymiany w łożysku.', 'Upewnienie się że maluch nabiera stabilnie wagę na finalną prostą.', 'Ile jest teraz płynu owodniowego? Czy dziecko rośnie proporcjonalnie w normach?', 1],
  [35, 'Badanie GBS (Tyg. 33–37)', 'Paciorkowiec z grupy B z wymazu pochwy.', 'By zadecydować czy antybiotyk podawany w chwili przed akcją jest przymusowy na ochronę dla rodzącego.', 'Zlecone GBS? Kiedy mama będzie sprawdzana, jeśli wyjdzie pozytywny paciorkowiec co to zmienia?', 1],
  [38, 'USG Dopplera i KTG co pow. 1 tydzień', 'Wizyty co 1-2 tygodnie dla KTG, sprawdzanie szyjki macicy ginekologicznie, monitoring serca tętna.', 'Codzienny monitoring medyczny zabezpiecza przeciw nieprawidłowościom ukrytym jak spadek dróg podaży tlenu.', 'Jak odróżnić skurcze ćwiczące Braxtona-Hicksa po KTG z prawdziwymi skurczami na IP?', 1],
  [41, 'Monitoring porodu po 41 tyg.', 'Monitoring niemalże co drugi czy trzeci dzień.', 'Łożysko przestaje działać w pełni poprawnie po terminie przedłużenia się dając stan niedotlenienia.', 'Rozmowa ojca z lekarzem o opcjach na plan procedury przy przekroczeniu terminu, po co indukcja kiedy w szpitalu?', 1]
];

const insertCheckups = db.transaction(() => {
  for (const c of checkups) { insertCheckup.run(...c); }
});
insertCheckups();
console.log(`Inserted ${checkups.length} checkups`);

module.exports = {};
