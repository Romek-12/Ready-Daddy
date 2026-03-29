const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Deck of reaction cards - what dad should do/not do in each pregnancy phase
const REACTION_DECK = [
  {
    id: '4-6', weekRange: '4–6 tydzień', emoji: '🌱', title: 'Szok po teście',
    herSide: ['Partnerka ma niezłą huśtawkę. Radość i lęk w jednym.', 'Skrajne zmęczenie i pierwsze mdłości.', 'Przeszkadzają jej zapachy, na które wcześniej nie zwracała uwagi.'],
    do: ['Zapewnij ją, że to normalne, oboje macie prawo do obaw.', 'Weź na siebie gotowanie – zapachy z kuchni to dla niej teraz koszmar.', 'Troszcz się i proponuj wsparcie przy wizytach kontrolnych.'],
    dont: ['Nie śmiej się, kiedy płacze z byle powodu.', 'Nie neguj jej objawów. Ona naprawdę źle się czuje.'],
    trimester: 'I'
  },
  {
    id: '7-10', weekRange: '7–10 tydzień', emoji: '🎢', title: 'Hormonalny rollercoaster',
    herSide: ['Kobieta jest na rollercoasterze emocji. Śmieje się, żeby zaraz płakać.', 'Niedobrze jej, jest bardzo słaba i zmęczona wczesną ciążą.', 'Zaczyna mieć dziwne zachcianki albo nie znosi swoich ulubionych rzeczy.'],
    do: ['Traktuj jej emocje serio, nawet jeśli brzmią irracjonalnie.', 'Dbaj o dostęp do jej ulubionych, lekkich przekąsek.', 'Bądź wyrozumiały dla jej huśtawek nastrojów.'],
    dont: ['Nigdy nie mów "to tylko hormony".', 'Nie żartuj z jej nagłych zachcianek kulinarnych.'],
    trimester: 'I'
  },
  {
    id: '11-13', weekRange: '11–13 tydzień', emoji: '🌿', title: 'Pierwsze oswojenie ciąży',
    herSide: ['Najgorsze mdłości zanikają, ale energia jeszcze nie wraca w pełni.', 'Pojawiają się obawy o finanse, miejsce w domu, przygotowania.', 'Denerwują ją wścibskie komentarze wokół jej ciała.'],
    do: ['Usiądźcie spokojnie i stwórzcie plan działania (finanse, pokój).', 'Przypominaj, że oboje wspólnie w tym uczestniczycie.', 'Gdy mówi, że się boi, zwaliduj jej lęki i wspieraj.'],
    dont: ['Nie każ jej czytać poradników, jeśli woli po prostu odpocząć.', 'Powstrzymaj się od komentowania zmian jej ciała w negatywny sposób.'],
    trimester: 'I'
  },
  {
    id: '14-18', weekRange: '14–18 tydzień', emoji: '✨', title: 'Złoty okres',
    herSide: ['Samopoczucie ulega znacznej poprawie, wraca energia.', 'Zaczyna widać zaokrąglony brzuch, co cieszy, ale i stresuje zmianą wyglądu.', 'W głowie nadal jest obawa o połówkowe badanie USG.'],
    do: ['To świetny czas na spacery i aktywność we dwoje.', 'Idź z partnerką na ważne badania, Twoja obecność to silne wsparcie.', 'Komplementuj jej wygląd i podkreślaj, jaka jest piękna.'],
    dont: ['Nie dystansuj się w tym "złotym okresie". Czas spędzony we dwoje jest kluczowy.', 'Nie podsycaj jej lęku o przebieg ciąży przed badaniami.'],
    trimester: 'II'
  },
  {
    id: '19-23', weekRange: '19–23 tydzień', emoji: '🤱', title: 'Pierwsze ruchy dziecka',
    herSide: ['Zaczyna wyraźnie czuć ruchy – to bardzo wzruszający moment.', 'Pojawiają się specyficzne ciążowe zachcianki o dziwnych porach.', 'Zaczyna ciążyć jej kręgosłup, może pojawić się zgaga.'],
    do: ['Połóż dłoń na jej brzuchu, żeby razem doświadczać tych chwil.', 'Masuj jej obolałe plecy – to najprostszy sposób, by przynieść ulgę.', 'Zrozum jej nietypowe ochoty na jedzenie.'],
    dont: ['Nie irytuj się, jeśli ruchy dziecka nie są od razu wyczuwalne dla Ciebie.', 'Zostaw logistykę jedzenia jej ciału – nie ingeruj w bezpieczne zachcianki.'],
    trimester: 'II'
  },
  {
    id: '24-27', weekRange: '24–27 tydzień', emoji: '🤰', title: 'Rosnący brzuch, pytania',
    herSide: ['Ciało kobiety ulega dużej zmianie, rosnący brzuch wpływa na mechanikę ruchu.', 'Może czuć się przestraszona tym, co przyniesie przyszłość i czy podoła roli mamy.', 'Słabiej śpi, kręci się i często wstaje do toalety w nocy.'],
    do: ['Głośno zachwycaj się nią jako wspaniałą kobietą i partnerką.', 'Pomyślcie nad podziałem obowiązków w domu po narodzinach dziecka.', 'Odciążaj ją w sprawach logistycznych na zewnątrz.'],
    dont: ['Nie rzucaj żartów o "wielorybach" czy rozstępach – to nie na miejscu.', 'Nie sugeruj, że po porodzie od razu musi zrzucić wagę.'],
    trimester: 'II'
  },
  {
    id: '28-32', weekRange: '28–32 tydzień', emoji: '😮‍💨', title: 'Nowe zmęczenie III trymestrem',
    herSide: ['Pojawiają się obrzęki, nogi i dłonie zaczynają mocniej puchnąć.', 'Narasta dyskomfort fizyczny – coraz trudniej znaleźć dobrą pozycję.', 'Zaczynają rodzić się lęki o sam moment porodu pod wpływem otoczenia.'],
    do: ['Tłum "dobre rady" od kuzynek o trudnych porodach – chroń ją przed stresem.', 'Pomóż jej w fizycznych aktywnościach, unikaj namawiania jej do długiego stania.', 'Rozpocznij z nią przygotowania logistyczne do szpitala (Szkoła Rodzenia).'],
    dont: ['Nie opowiadaj "przerażających" historii z porodówek znajomych.', 'Nie narzekaj na swój stres – ona potrzebuje oparcia i spokoju.'],
    trimester: 'III'
  },
  {
    id: '33-37', weekRange: '33–37 tydzień', emoji: '🧹', title: 'Syndrom wicia gniazda',
    herSide: ['Dominuje szał sprzątania i układania wszystkiego dla niemowlaka.', 'Nerwowość i poczucie przytłoczenia faktem braku pełnej gotowości.', 'Wątpliwości przed rodzeniem – "Czy moje ciało, a on jako ojciec damy radę?"'],
    do: ['Pomagaj jej w tym rytuale. Bierz ciężkie prace (przemeblowanie, skręcanie) na siebie.', 'Upewniaj ją w Waszej wspólnej sile i gotowości.', 'Filtruj gości i kontakty od osób, które ją denerwują lub za mocno naciskają.'],
    dont: ['Nie mów, że przesadza z układaniem malutkich ubranek do szafek.', 'Nie organizuj niezapowiedzianych hucznych zjazdów rodziny bez skonsultowania z nią.'],
    trimester: 'III'
  },
  {
    id: '38-42', weekRange: '38–42 tydzień', emoji: '⏳', title: 'Czekanie i znużenie',
    herSide: ['Wyjątkowo duże znużenie olbrzymim ciężarem i dyskomfortem na co dzień.', 'Irytacja na pytania "To już?" rozsyłane od wszystkich znajomych.', 'Bolesne skurcze przepowiadające wywołujące fałszywy alarm i dezorientację.'],
    do: ['Bądź rzecznikiem i odpowiadaj za nią na SMS-y natarczywej rodziny.', 'Sprawuj pieczę nad planem awaryjnym i walizkami, miej bak w aucie pełny.', 'Zachowuj ogromny spokój, daj jej pewność i relaksujący czas we dwoje.'],
    dont: ['Zrezygnuj całkowicie z prób zachęcania "Zrób coś, bo chciałbym już, żeby wyszło".', 'Nie sugeruj jej na siłę dziwnych rad z internetu na wywoływanie porodu.'],
    trimester: 'III'
  },
  {
    id: '0-3pp', weekRange: '0–3 tyg. po porodzie', emoji: '👶', title: 'Początki w realnym świecie',
    herSide: ['Tato! Kobieta zmaga się z krwawieniem, bólem fizycznym i ranami.', 'Pojawia się baby blues – intensywne łzy radości i ogromny smutek zmęczenia.', 'Ciągła frustracja powiązana z laktacją i odpowiedzialnością za nowe życie.'],
    do: ['Zadbaj o podaż picia i jedzenia dla karmiącej matki.', 'Zapewnij, że gorszy nastrój, wina i łzy w tym czasie to naturalny efekt zmęczenia.', 'Stań się murem dla gości na najbliższy czas – priorytetem jest mama i dziecko.'],
    dont: ['Nie instruuj jej bez przerwy jak powinna trzymać czy karmić dziecko z internetowych poradników.', 'Oddzielcie się od głośnych i tłumnych spotkań dla dobra psychicznego w domu.'],
    trimester: 'IV'
  },
  {
    id: '4-8pp', weekRange: '4–8 tyg. po', emoji: '🌊', title: 'Wymagająca codzienność',
    herSide: ['Pojawia się świadomość utraty dawnej wolności i starego życia co boli.', 'Przewlekłe niewyspanie, dezorientacja co prowadzi do spadku morale.', 'Lęk że jest "Złą Mamą" bo nie potrafi naturalnie czerpać radości codziennej.'],
    do: ['Powiedz szczerze "Ja też tęskniłem za weekendowym lenistwem". Przełam tabu żalu po starym życiu.', 'Angażuj się w logistykę, by matka miała godzinę dla siebie na spacerze.', 'Mów bezpośrednio, dziel się odczuciami "Jak my się czujemy?" "Jak ty?"'],
    dont: ['Nie sugeruj, że bieganie lub joga załatwi ból psychiczny.', 'Nie porównuj jej codzienności do sielanek z Instagrama innych matek.'],
    trimester: 'IV'
  },
  {
    id: '9-12pp', weekRange: '9–12 tyg. po', emoji: '🌅', title: 'Wyjście z mgły',
    herSide: ['Zaczynacie chwytać nową rutynę, a sen wydłuża się co buduje nową strefę optymizmu.', 'Depresyjne stany zaczynają maleć, widzi swoją sprawczość i siłę w nowej roli.', 'Zmiany na rzecz powrotu do pracy spędzają dreszcz i wymagają organizacji czasu.'],
    do: ['Wyjdź jako rodzina na spokojniejsze wyjścia we trójkę.', 'Przejmij nocne wstania w miarę możliwości – odciążasz zmęczony organizm.', 'Czuwaj nad symptomami załamania psychicznego i zachęcaj do specjalistów.'],
    dont: ['Nie unikaj twardych tematów pod pozorem "Nic się nie stało".', 'Nie mów "inni mają gorzej". Ważne wsparcie tu i teraz.'],
    trimester: 'IV'
  }
];

// GET /api/action-cards/deck - all reaction cards for the swipe deck
router.get('/deck', authenticateToken, (req, res) => {
  res.json({ cards: REACTION_DECK });
});

module.exports = router;
