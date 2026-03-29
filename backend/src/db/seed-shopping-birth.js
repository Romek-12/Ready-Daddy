const db = require('./database');

console.log('Seeding shopping items...');
const insertItem = db.prepare(`INSERT INTO shopping_items (trimester,name,category,is_essential,estimated_cost_pln,notes) VALUES (?,?,?,?,?,?)`);

const items = [
  [3, 'Fotelik samochodowy 0–13 kg', 'Niezbędne', 1, 400, 'Certyfikat ECE R44 lub R129. Zamontowany PRZED terminem'],
  [3, 'Łóżeczko + materac twardy', 'Niezbędne', 1, 500, 'Materac dopasowany do łóżeczka — szczelina max 2 cm'],
  [3, 'Śpiochy / body x 5', 'Niezbędne', 1, 150, 'Rozmiar 56–62, nie 50 — rosną szybko'],
  [3, 'Czapeczki x 3', 'Niezbędne', 1, 30, 'Głównie na pierwsze tygodnie'],
  [3, 'Pieluszki noworodkowe', 'Niezbędne', 1, 50, '1 opakowanie — może inny rozmiar pasować lepiej'],
  [3, 'Mokre chusteczki', 'Niezbędne', 1, 20, 'Bez alkoholu, hipoalergiczne'],
  [3, 'Wózek spacerowo-gondola', 'Przydatne', 0, 1500, 'Sprawdź czy gondola jest homologowana do snu'],
  [3, 'Nosidełko ergonomiczne', 'Przydatne', 0, 250, 'M-pozycja kolan wyżej niż biodra'],
  [3, 'Elektryczny laktator', 'Przydatne', 0, 300, 'Jeśli mama planuje karmienie piersią'],
  [3, 'Termometr + aspirator', 'Przydatne', 0, 100, 'Absolutna konieczność przy infekcjach'],
  [3, 'Baby monitor', 'Przydatne', 0, 200, 'Opcjonalnie — zależy od układu mieszkania'],
  [3, 'Kąpielka + termometr', 'Przydatne', 0, 80, 'Temperatura wody: 37°C'],
  [3, 'Huśtawka / leżaczek', 'Opcjonalne', 0, 150, 'Przydatna jeśli masz wolne ręce'],
  [3, 'Przewijak', 'Opcjonalne', 0, 100, 'Mata przewijana na komodzie = tańsza opcja'],
  [3, 'Sterylizator', 'Opcjonalne', 0, 120, 'Niezbędny przy butelkach; przy piersi mniej konieczny']
];

const insertItems = db.transaction(() => {
  for (const i of items) { insertItem.run(...i); }
});
insertItems();
console.log(`Inserted ${items.length} shopping items`);

console.log('Seeding birth preparation...');
const insertBirth = db.prepare(`INSERT INTO birth_preparation (stage,title,description,partner_role,duration_info,emergency_notes) VALUES (?,?,?,?,?,?)`);

const birthStages = [
  [1, 'Faza latentna (1–3 cm)', 'Nieregularne skurcze, szyjka się otwiera.', 'Bądź przy niej, pomóż zliczyć skurcze.', 'Do momentu aż skurcze będą wg 5-1-1', 'Gdy nagłe odejście wód lub krwawienie i ból stały – natychmiast IP.'],
  [2, 'Faza aktywna (4–7 cm)', 'Silne, regularne skurcze porodowe narastające na sile.', 'Masuj plecy, oddychaj razem z nią, mów spokojnie. Pielęgnuj przestrzeń (światła).', 'Kilka godzin do kilkunastu', 'Alarm dla braku przerw lub krwotoku.'],
  [3, 'Faza przejściowa (8–10 cm)', 'Najintensywniejsza, ale krótka. Tu może odczuć kryzys bólowy.', 'Nie dawaj pustych rad. Trzymaj za rękę. Mów \"dajesz radę\". Nie zważaj na wyrzucany złość.', 'Najkrótsza w całości fazy 1.', 'Jeżeli rodząca traci oddech, przerywa krzyczenie, upewnijcie się o pomocy z położną.'],
  [4, 'Faza parcia', 'Mama pcha, by noworodek schodził niżej dnem miednicy.', 'Mów jej kiedy ma przeć jeśli poprosi — słuchaj poleceń położnej.', 'Godziny potrafią pędzić w minuty (15min-2h).', ''],
  [5, 'Moje urodziny', 'Wychodzę na naświetlenie sal porodowych.', 'Obetnij moją pępowinę jeśli chcesz — poinformuj lekarza i położną wcześniej.', 'To ta słynna minuta.', ''],
  [6, 'Wydalenie łożyska', 'Ostatnie kilka skurczów na oddzielenie i wydalenie popłodu.', 'Zajmij się mną — rób skin-to-skin jeśli mama zaszywana. Mówcie do mnie.', 'Około kilkanaście do pół godziny po urodzeniu.', 'Gwałtowny brak zatrzymania krwawienia u mamy rzuca tu na szale wyzwania izb.']
];

const insertBirths = db.transaction(() => {
  for (const b of birthStages) { insertBirth.run(...b); }
});
insertBirths();
console.log(`Inserted ${birthStages.length} birth stages`);

console.log('Seeding bag checklist...');
const insertBag = db.prepare(`INSERT INTO bag_checklist (category,item_name,for_whom,is_essential) VALUES (?,?,?,?)`);

const bagItems = [
  ['Dla mamy', 'Karta ciąży (najważniejszy dokument)', 'mama', 1],
  ['Dla mamy', 'Dowód osobisty', 'mama', 1],
  ['Dla mamy', 'Wyniki wszystkich badań z ciąży', 'mama', 1],
  ['Dla mamy', 'Piżama z dostępem do karmienia', 'mama', 1],
  ['Dla mamy', 'Podkłady jednorazowe', 'mama', 1],
  ['Dla mamy', 'Ulubione napoje i lekkie przekąski', 'mama', 1],
  ['Dla mamy', 'Ładowarka do telefonu', 'mama', 1],
  ['Dla mamy', 'Muzyka / słuchawki', 'mama', 0],
  ['Dla mamy', 'Krem/olejek do masażu', 'mama', 0],
  ['Dla dziecka', 'Body (2 szt.)', 'dziecko', 1],
  ['Dla dziecka', 'Śpioszki (2 szt.)', 'dziecko', 1],
  ['Dla dziecka', 'Rękawiczki anty-scratch', 'dziecko', 1],
  ['Dla dziecka', 'Czapeczka', 'dziecko', 1],
  ['Dla dziecka', 'Kocyk', 'dziecko', 1],
  ['Dla dziecka', 'Fotelik samochodowy (w aucie)', 'dziecko', 1],
  ['Dla taty', 'Przekąski na długie godziny', 'tata', 1],
  ['Dla taty', 'Ładowarka do telefonu', 'tata', 1],
  ['Dla taty', 'Zmiana ubrania', 'tata', 1],
  ['Dla taty', 'Gotówka (parking, automat)', 'tata', 1],
  ['Dla taty', 'Lista numerów telefonicznych', 'tata', 1]
];

const insertBags = db.transaction(() => {
  for (const b of bagItems) { insertBag.run(...b); }
});
insertBags();
console.log(`Inserted ${bagItems.length} bag items`);

module.exports = {};
