/**
 * Dad Module static content.
 * Edit this file to update content without rebuilding the mobile app.
 * After editing, restart the backend server.
 */

module.exports = {
  sections: [
    { id: 'ciaza',       icon: 'mom',      iconColorKey: 'primary',   title: 'Ciąża z perspektywy ojca' },
    { id: 'po-porodzie', icon: 'baby',     iconColorKey: 'primary',   title: 'Po narodzinach dziecka' },
    { id: 'konflikty',   icon: 'partner',  iconColorKey: 'accent',    title: 'Wewnętrzne rozterki ojców' },
    { id: 'sygnaly',     icon: 'warning',  iconColorKey: 'danger',    title: 'Niepokojące sygnały ostrzegawcze' },
    { id: 'pomoc',       icon: 'lightbulb',iconColorKey: 'primary',   title: 'Jak sobie pomóc na co dzień' },
    { id: 'specjalista', icon: 'hospital', iconColorKey: 'accent',    title: 'Kiedy skorzystać z pomocy specjalisty' },
    { id: 'wspolzycie',  icon: 'couple',   iconColorKey: 'rose',      title: 'Życie intymne i współżycie' },
    { id: 'bibliografia',icon: 'science',  iconColorKey: 'dadModule', title: 'Bibliografia i źródła medyczne' },
  ],

  emotions: [
    { icon: 'happy',        label: 'Radość i duma',                          desc: 'Czujesz podekscytowanie zbliżającym się tacierzyństwem.' },
    { icon: 'anxious',      label: 'Lęk i niepokój',                         desc: 'Boisz się o zdrowie matki i dziecka oraz zastanawiasz się nad stabilnością finansową.' },
    { icon: 'sad',          label: 'Poczucie izolacji',                      desc: 'Uwaga otoczenia przypada głównie matce, przez co ojciec zsuwa się na dalszy plan.' },
    { icon: 'sick',         label: 'Drażliwość i kłopoty ze snem',           desc: 'Przewlekłe napięcie może objawiać się obniżonym nastrojem i bezsennością.' },
    { icon: 'emergency',    label: 'Objawy psychosomatyczne (Syndrom kuwady)',desc: 'Jako partner możesz odczuwać fizjologiczne objawy, bardzo podobne do ciążowych, na wczesnym i późnym etapie ciąży.' },
    { icon: 'do-not-touch', label: 'Tłumienie uczuć',                        desc: 'U przyszłych ojców często pojawia się społeczny przymus "silnej głowy rodziny", niepozwalający uzewnętrzniać zmęczenia.' },
  ],

  stats: [
    { num: '~8-10%',  desc: 'ojców doświadcza klinicznej depresji poporodowej.' },
    { num: '24-50%',  desc: 'ojców zapada na depresję poporodową, gdy choruje ich partnerka.' },
    { num: '3-25%',   desc: 'mężczyzn odczuwa kliniczny poziom lęku w okresie samej ciąży.' },
  ],

  conflicts: [
    { feel: '„Muszę być zawsze silny i wspierający"',        clash: 'W rzeczywistości odczuwasz potworne zmęczenie emocjonalne, bezradność i niepewność.' },
    { feel: '„Powinienem odczuwać wyłącznie euforię"',       clash: 'Tymczasem często targają Tobą frustracje, brak cierpliwości do przedłużających się trudności i zwykła złość.' },
    { feel: '„Stracę dotychczasową relację z partnerką"',    clash: 'Pojawia się ogromna obawa o całkowite ochłodzenie stosunków intymnych oraz pogłębienie urządzania życia tylko pod noworodka.' },
    { feel: '„Muszę sprostać wymaganiom finansowym"',        clash: 'Narasta obawa przed zwiększeniem się domowych rachunków i rosnącej presji na szybki zarobek.' },
    { feel: '„Chcę angażować się w opiekę i pomagać"',       clash: 'Napotykasz tzw. "gatekeeping", czyli barierę ze strony matki z poprawianiem u Ciebie na każdym kroku najdrobniejszych błędów (przebieranie, trzymanie, mycie).' },
  ],

  warnings: [
    { icon: 'sad',          text: 'Przewlekłe odczuwanie permanentnej pustki i przedłużający się obniżony stan nastroju - nic nie sprawia radości.' },
    { icon: 'sick',         text: 'Zwiększona pobudliwość i duża irytacja, często wywołująca kłótnie w błahej rzeczy z domownikami.' },
    { icon: 'sleep',        text: 'Krytyczne problemy ze zdrowym snem: niemożność uśnięcia lub głębokie koszmary na granicy paranoi o los dzieci w domu.' },
    { icon: 'do-not-touch', text: 'Pojawienie się całkowitej oziębłości wobec domowników, w tym dla małego dziecka, a także na samą wizję spotkań z dotychczasowymi przyjaciółmi.' },
    { icon: 'emergency',    text: 'Mechanizmy odcięciowe i ucieczkowe – częstsze użycie alkoholu i substancji czy przesiadywania bez celu w aucie do późnego wieczora byle nie wejść do domu.' },
    { icon: 'chat',         text: 'Nawracające natrętne myśli przekonujące, że jesteś złym ojcem, chęć odejścia i zrzeczenia się odpowiedzialności po stracie nadziei.' },
  ],

  helpSteps: [
    { title: 'Otwarta komunikacja o własnych trudnościach',           desc: 'Porażka komunikacji to najkrótsza z dróg do kłopotu – wyszeptaj żonie, że nie masz siły. Werbalizacja ciężaru wielokrotnie pomaga.' },
    { title: 'Podniesienie jakości komunikacji w partnerstwie',        desc: 'Unikaj zwrotu „Ty mnie nigdy w ogóle...". Bądź mądrzejszy, użyj pozytywnego „Potrzebny byłem tu przy..." i mówcie wprost o tym, czego potrzebujecie.' },
    { title: 'Samodzielność u ojca buduje relację z dzieckiem',        desc: 'Znajdź jeden obowiązek względem dziecka, który wykonujesz samodzielnie. Zbudujesz więź i pewność siebie.' },
    { title: 'Zróbcie wyraźny pakt z podziałem obowiązków',           desc: 'Ustalajcie harmonogramy i trzymajcie się ich – unikniecie awantur o to, komu wolno więcej odpocząć.' },
    { title: 'Wygospodaruj codziennie chwilę tylko dla siebie',       desc: '15 minut ciszy dziennie to mocna ochrona baterii ojcowskich na trudny czas.' },
    { title: 'Spotkanie z innymi ojcami',                              desc: 'Badania wskazują na ogromną ulgę, jaką daje rozmowa z ojcami, którzy przeszli przez nocne czuwania z noworodkiem.' },
  ],

  specialists: [
    { icon: 'hospital', title: 'Psychiatra',       desc: 'Nie bój się wizyty u psychiatry, gdy bezsenność, stany lękowe lub depresja trwają dłużej niż kilka tygodni.' },
    { icon: 'partner',  title: 'Psychoterapeuta',  desc: 'Regularne rozmowy z psychoterapeutą pomagają przepracować kryzys tożsamości i lęki związane z ojcostwem.' },
    { icon: 'couple',   title: 'Terapia par',       desc: 'Gdy napięcia w domu narastają i nie możecie się dogadać, terapeuta par pomoże odbudować komunikację i bliskość.' },
  ],

  trimesterLibido: [
    { badge: 'I trymestr',    weeks: 'Tygodnie 1-13',             colorHex: '#FEF3C7', textColorHex: '#92400E', title: 'Naturalny spadek popędu i nastroju',            desc: 'We wczesnej ciąży mdłości, permanentne zmęczenie i wahania hormonalne znacząco obniżają libido.', tags: [{ text: 'libido wyraźnie spada', type: 'down' }, { text: 'duże obciążenie fizyczne', type: 'down' }] },
    { badge: 'II trymestr',   weeks: 'Tygodnie 14-27',            colorHex: '#D1FAE5', textColorHex: '#065F46', title: 'Powrót energii – najlepszy czas',                desc: 'Dopływ ukrwienia miednicy mocno pobudza libido, a brzuszek wciąż nie stanowi dużego ograniczenia.', tags: [{ text: 'zwykle najlepsze pożądanie', type: 'up' }, { text: 'dużo wyższy komfort', type: 'up' }] },
    { badge: 'III trymestr',  weeks: 'Tygodnie 28-40',            colorHex: '#FEE2E2', textColorHex: '#991B1B', title: 'Spadek uwarunkowany przez fizyczny ciężar',      desc: 'Ostatnie tygodnie to ogromny przyrost wagi i trudności ze znalezieniem wygodnej pozycji. Czas na wsparcie poprzez masaż i empatię.', tags: [{ text: 'zmniejszona ochota na intymność', type: 'down' }, { text: 'wysoka potrzeba dotyku', type: 'mixed' }] },
    { badge: 'Po porodzie',   weeks: 'Okres połogu i laktacji',   colorHex: '#EDE9FE', textColorHex: '#5B21B6', title: 'Absolutna przerwa na długie tygodnie',           desc: 'Laktacja i ogromne zmęczenie hamują estrogen, powodując suchość i brak ochoty na intymność.', tags: [{ text: 'przymusowa przerwa min. 6 tygodni', type: 'down' }, { text: 'suchość przez zmiany hormonalne', type: 'down' }] },
  ],

  safePractices: [
    { title: 'Oszczędzanie i wygoda',               desc: 'Wybierajcie pozycje oszczędzające brzuch – na boku lub gdy partnerka przejmuje inicjatywę. Unikajcie nacisku na brzuszek.' },
    { title: 'Odpowiednia komunikacja we dwoje',     desc: 'Ciało kobiety zmienia się z tygodnia na tydzień. Rozmawiajcie o tym, co jest przyjemne, a co sprawia dyskomfort.' },
    { title: 'Bliskość bez presji',                  desc: 'Rozbudzajcie intymność nie tylko przez seks, ale też masaże, dotyk i przytulanie.' },
  ],

  stopReasons: [
    'Każdorazowe wystąpienie silnego krwawienia lub plamienia z dróg rodnych po kontakcie.',
    'Podejrzenie lub rzeczywiste odejście wód płodowych na jakimkolwiek etapie ciąży.',
    'Stwierdzona przez lekarza patologia łożyska (np. łożysko przodujące).',
    'Diagnoza niewydolności cieśniowo-szyjkowej lub skracanie się szyjki macicy.',
    'Wysokie ryzyko porodu przedwczesnego lub lekarski nakaz oszczędzającego trybu życia.',
    'Dolegliwości bólowe ze strony miednicy, skurcze lub silny dyskomfort po stronie partnerki.',
  ],

  postBirthSex: [
    { title: 'Medyczny czas połogu (ok. 6 tygodni)',     desc: 'Zaleca się powstrzymanie od współżycia do zakończenia krwawienia połogowego i wygojenia ran krocza.' },
    { title: 'Wizyta kontrolna u ginekologa',             desc: 'Zielone światło na aktywność seksualną powinno być potwierdzone podczas wizyty połogowej (sprawdzenie szwów i blizn).' },
    { title: 'Długa droga po cięciu cesarskim',           desc: 'Mimo nienaruszonej drogi rodnej, rekonwalescencja powłok brzusznych wymaga tych samych restrykcji co poród naturalny.' },
    { title: 'Znaczenie nawilżenia',                      desc: 'Ze względu na zmiany hormonalne (szczególnie podczas laktacji) naturalne nawilżenie często zanika. Używajcie lubrykantów medycznych.' },
    { title: 'Cierpliwość co do gotowości',               desc: 'Obolałe rany, piersi i potworny głód snu mogą powodować zerowe pożądanie przez wiele miesięcy. To normalne.' },
  ],

  talkSteps: [
    { title: 'Pytaj wprost, zamiast zgadywać',            desc: 'Zamiast domyślać się, jasno dopytaj o emocjonalną i fizyczną otwartość partnerki.' },
    { title: 'Zdejmij presję z obojga',                   desc: 'Daj jasno do zrozumienia, że jeśli partnerka potrzebuje tylko snu lub przytulania – absolutnie nie oczekujesz niczego więcej.' },
    { title: 'Dziel się własnymi niepewnościami',          desc: 'Przyznaj się do obaw o zranienie jej lub do własnych lęków. Pokazanie słabości zbliża.' },
    { title: 'Prolaktyna to chemia, nie brak miłości',    desc: 'Spadek libido po ciąży to efekt hormonów – prolaktyny i kortyzolu. Nie oznacza zaniku miłości.' },
  ],

  bibliography: [
    { id: '1', authors: 'Philpott, L.F. et al. (2021)',                            title: "Men's experience of transition to first-time fatherhood.",       journal: "Journal of Men's Health" },
    { id: '2', authors: 'Rao, W.W. et al. (2020)',                                 title: 'Prevalence of prenatal and postpartum depression in fathers.',   journal: 'Journal of Affective Disorders' },
    { id: '3', authors: 'American College of Obstetricians and Gynecologists (2024)',title: 'Is it safe to have sex during pregnancy?',                      journal: 'ACOG Guidelines' },
    { id: '4', authors: 'Cameron, E.E. et al. (2016)',                             title: 'Prevalence of paternal depression in pregnancy and the postpartum.', journal: 'JAMA Pediatrics' },
    { id: '5', authors: 'BMJ Open (2024)',                                          title: "Fathers' mental health and well-being concerns during perinatal period.", journal: 'BMJ Open' },
    { id: '6', authors: 'World Health Organization (2023)',                         title: "Supporting fathers' mental health in the perinatal period.",     journal: 'WHO' },
  ],
};
