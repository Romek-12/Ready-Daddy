/**
 * Seed script for checkup_visits, checkup_categories, checkup_items tables.
 * Run once: node src/db/seed-checkup-visits.js
 * Safe to re-run – skips seeding if data already exists.
 */
const db = require('./database');

const existing = db.prepare('SELECT COUNT(*) as c FROM checkup_visits').get();
if (existing.c > 0) {
  console.log('checkup_visits already seeded, skipping.');
  process.exit(0);
}

const insertVisit = db.prepare(
  'INSERT INTO checkup_visits (week_range, title, subtitle, color_key, sort_order) VALUES (?, ?, ?, ?, ?)'
);
const insertCat = db.prepare(
  'INSERT INTO checkup_categories (visit_id, title, icon, color_key, single_check, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
);
const insertItem = db.prepare(
  'INSERT INTO checkup_items (category_id, name, optional, note, sort_order) VALUES (?, ?, ?, ?, ?)'
);

const VISITS = [
  {
    weekRange: 'Do 10. tygodnia',
    title: 'Pierwsza wizyta kontrolna',
    subtitle: 'Niezbędny wywiad medyczny, założenie karty ciąży i zlecenia pierwszych badań laboratoryjnych.',
    colorKey: 'trimester1',
    categories: [
      {
        title: 'Wizyta u ginekologa / położnej', icon: 'hospital', colorKey: 'birth', singleCheck: false,
        items: [
          { name: 'Badanie ogólne ginekologiczne i założenie karty ciąży' },
          { name: 'Pomiar ciśnienia tętniczego oraz masy ciała' },
          { name: 'Badanie gruczołów sutkowych' },
          { name: 'Skierowanie na konsultację stomatologiczną' },
        ],
      },
      {
        title: 'Badania laboratoryjne krwi i moczu', icon: 'science', colorKey: 'dadModule', singleCheck: true,
        items: [
          { name: 'Morfologia krwi' },
          { name: 'Badanie ogólne moczu' },
          { name: 'Oznaczenie grupy krwi i czynnika Rh', note: 'oraz przeciwciał odpornościowych' },
          { name: 'Badanie stężenia glukozy we krwi na czczo', note: '+ opcjonalnie test OGTT przy czynnikach ryzyka' },
          { name: 'Badanie VDRL (kiła)' },
          { name: 'Przeciwciała anty-HIV, HCV' },
          { name: 'Antygen HBs (WZW B)' },
          { name: 'Badanie w kierunku toksoplazmozy (IgG, IgM)' },
          { name: 'Badanie w kierunku różyczki (IgG, IgM)' },
          { name: 'Badanie TSH (tarczyca)' },
          { name: 'Badanie cytologiczne', note: 'jeśli nie było wykonywane w ciągu ostatnich 6 miesięcy' },
        ],
      },
    ],
  },
  {
    weekRange: '11–14 tydzień',
    title: 'USG genetyczne i test PAPP-A',
    subtitle: 'Ocena ryzyka wystąpienia wad genetycznych i dokładne ustalenie terminu porodu.',
    colorKey: 'trimester1',
    categories: [
      {
        title: 'Wizyta u ginekologa', icon: 'hospital', colorKey: 'birth', singleCheck: false,
        items: [
          { name: 'Badanie ogólne, pomiar masy ciała i ciśnienia tętniczego' },
          { name: 'Ocena ryzyka depresji ciążowej (wywiad)' },
        ],
      },
      {
        title: 'Badanie USG', icon: 'fetus', colorKey: 'primary', singleCheck: false,
        items: [
          { name: 'USG I trymestru (genetyczne)', note: 'ocena parametru NT, kości nosowej i anatomii płodu' },
        ],
      },
      {
        title: 'Badania prenatalne', icon: 'search', colorKey: 'checkups', singleCheck: false,
        items: [
          { name: 'Test podwójny (PAPP-A + wolna podjednostka beta-hCG)', note: 'diagnostyka ryzyka trisomii' },
          { name: 'Wolne płodowe DNA (NIPT)', optional: true, note: 'np. NIFTY, SANCCOB, pobranie krwi matki' },
        ],
      },
    ],
  },
  {
    weekRange: '15–20 tydzień',
    title: 'Wizyta kontrolna (II trymestr)',
    subtitle: 'Krótsza wizyta monitorująca parametry i badania kontrolne.',
    colorKey: 'trimester2',
    categories: [
      {
        title: 'Wizyta u ginekologa', icon: 'hospital', colorKey: 'birth', singleCheck: false,
        items: [
          { name: 'Badanie ogólne, waga, ciśnienie' },
          { name: 'Ocena czystości pochwy (biocenoza)' },
          { name: 'Badanie cytologiczne', note: 'jeśli nie wykonano wcześniej' },
        ],
      },
      {
        title: 'Badania laboratoryjne', icon: 'science', colorKey: 'dadModule', singleCheck: true,
        items: [
          { name: 'Morfologia krwi' },
          { name: 'Badanie ogólne moczu' },
          { name: 'Przeciwciała anty-Rh', note: 'tylko w przypadku ujemnego Rh u kobiety!' },
        ],
      },
      {
        title: 'Dodatkowa diagnostyka nieinwazyjna', icon: 'search', colorKey: 'checkups', singleCheck: false,
        items: [
          { name: 'Test potrójny', optional: true, note: 'wykonywany w określonych przypadkach zwiększonego ryzyka wad genetycznych' },
        ],
      },
    ],
  },
  {
    weekRange: '18–22 tydzień',
    title: 'USG połówkowe',
    subtitle: 'Dokładna ocena budowy anatomicznej narządów malucha, w tym echa serca oraz lokalizacji łożyska.',
    colorKey: 'trimester2',
    categories: [
      {
        title: 'USG referencyjne (2. trymestr)', icon: 'fetus', colorKey: 'primary', singleCheck: false,
        items: [
          { name: 'USG połówkowe', note: 'szczegółowa ocena anatomii dziecka (m.in. serce, układ nerwowy)' },
          { name: 'USG 3D/4D', optional: true, note: 'dla pamiątki w świetnym momencie (dodatkowo płatne)' },
        ],
      },
    ],
  },
  {
    weekRange: '21–26 tydzień',
    title: 'Test tolerancji glukozy (OGTT)',
    subtitle: 'Ważne badanie w kierunku cukrzycy ciążowej oraz rutynowa kontrola u ginekologa.',
    colorKey: 'trimester2',
    categories: [
      {
        title: 'Wizyta u ginekologa', icon: 'hospital', colorKey: 'birth', singleCheck: false,
        items: [
          { name: 'Badanie ogólne (ciśnienie, tętno, waga)' },
          { name: 'Wysłuchanie czynności serca płodu' },
          { name: 'Omówienie testu obciążenia glukozą' },
        ],
      },
      {
        title: 'Badania laboratoryjne', icon: 'science', colorKey: 'dadModule', singleCheck: true,
        items: [
          { name: 'Morfologia krwi' },
          { name: 'Badanie ogólne moczu' },
          { name: 'Krzywa cukrowa (OGTT 75g glukozy)', note: 'Trzypunktowe badanie na czczo, po 1h i 2h (przez 24-28 tydzień)' },
          { name: 'Przeciwciała anty-Rh', note: 'przy ujemnym Rh matki' },
          { name: 'Badanie w kierunku toksoplazmozy', note: 'jeśli poprzedni wynik przeciwciał IgG był ujemny' },
        ],
      },
    ],
  },
  {
    weekRange: '27–32 tydzień',
    title: 'USG 3. trymestru (Doppler)',
    subtitle: 'Ocena wagi i wzrostu dziecka oraz wydolności łożyska i przepływów krwi.',
    colorKey: 'trimester3',
    categories: [
      {
        title: 'Wizyta kontrolna', icon: 'hospital', colorKey: 'birth', singleCheck: false,
        items: [
          { name: 'Badanie ginekologiczne i wywiad (ciśnienie, tętno)' },
          { name: 'Ocena czynności serca płodu' },
        ],
      },
      {
        title: 'Badania laboratoryjne', icon: 'science', colorKey: 'dadModule', singleCheck: true,
        items: [
          { name: 'Morfologia krwi' },
          { name: 'Badanie ogólne moczu' },
          { name: 'Przeciwciała anty-Rh', note: 'U kobiet Rh-' },
          { name: 'Podanie immunoglobuliny anty-D', note: 'Zalecane u kobiet Rh- między 28 a 30 tygodniem ciąży' },
        ],
      },
      {
        title: 'USG referencyjne (3. trymestr)', icon: 'fetus', colorKey: 'primary', singleCheck: false,
        items: [
          { name: 'USG III trymestru', note: 'Wraz z oceną przepływów naczyniowych (Doppler) i ilości wód płodowych' },
        ],
      },
    ],
  },
  {
    weekRange: '33–37 tydzień',
    title: 'Posiew GBS i komplet badań III trymestru',
    subtitle: 'Ważne badanie na obecność paciorkowca oraz przygotowanie do porodu.',
    colorKey: 'trimester3',
    categories: [
      {
        title: 'Wizyta u ginekologa', icon: 'hospital', colorKey: 'birth', singleCheck: false,
        items: [
          { name: 'Badanie ogólne, waga, ciśnienie i badanie położnicze' },
          { name: 'Ocena ruchów płodu' },
          { name: 'Wysłuchanie tętna płodu' },
          { name: 'Ocena ryzyka depresji (powtórny wywiad)' },
        ],
      },
      {
        title: 'Badania laboratoryjne i posiew', icon: 'science', colorKey: 'dadModule', singleCheck: true,
        items: [
          { name: 'Morfologia krwi' },
          { name: 'Badanie ogólne moczu' },
          { name: 'Antygen HBs (WZW B)' },
          { name: 'Przeciwciała anty-HIV' },
          { name: 'Wymaz na paciorkowce - GBS', note: 'Z pochwy i odbytu (bardzo ważne przed porodem naturalnym; wykonywane ok 35-37 tyg.)' },
          { name: 'Badanie VDRL, HCV', note: 'Zwykle w III trymestrze przy zwiększonym ryzyku' },
        ],
      },
    ],
  },
  {
    weekRange: '38–39 tydzień',
    title: 'Ostatnie kontrole przed rozwiązaniem',
    subtitle: 'Gotowość do wyjazdu na boks i cotygodniowy nadzór.',
    colorKey: 'trimester3',
    categories: [
      {
        title: 'Wizyta u ginekologa', icon: 'hospital', colorKey: 'birth', singleCheck: false,
        items: [
          { name: 'Ocena szyjki macicy (badanie ginekologiczne)' },
          { name: 'Kontrola czynności serca i ocena aktywności ruchów' },
        ],
      },
      {
        title: 'W razie zaleceń', icon: 'science', colorKey: 'dadModule', singleCheck: true,
        items: [
          { name: 'Morfologia' },
          { name: 'Mocz ogólny' },
        ],
      },
    ],
  },
  {
    weekRange: '40+ tydzień',
    title: 'Ciąża przeterminowana',
    subtitle: 'Rejestracje czynności serca (KTG) i weryfikacja ilości płynu owodniowego.',
    colorKey: 'danger',
    categories: [
      {
        title: 'Wzmożony nadzór', icon: 'warning', colorKey: 'danger', singleCheck: false,
        items: [
          { name: 'Zapis KTG (kardiotokografia)', note: 'Mierzy napięcie mięśnia macicy i bicie serca płodu' },
          { name: 'Badanie USG', note: 'Monitoring ilości płynu owodniowego' },
        ],
      },
    ],
  },
];

const seed = db.transaction(() => {
  VISITS.forEach((visit, vIdx) => {
    const vResult = insertVisit.run(visit.weekRange, visit.title, visit.subtitle, visit.colorKey, vIdx);
    const visitId = vResult.lastInsertRowid;

    visit.categories.forEach((cat, cIdx) => {
      const cResult = insertCat.run(visitId, cat.title, cat.icon, cat.colorKey, cat.singleCheck ? 1 : 0, cIdx);
      const catId = cResult.lastInsertRowid;

      cat.items.forEach((item, iIdx) => {
        insertItem.run(catId, item.name, item.optional ? 1 : 0, item.note || null, iIdx);
      });
    });
  });
});

seed();
console.log(`Seeded ${VISITS.length} checkup visits.`);
