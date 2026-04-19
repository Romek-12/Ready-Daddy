# Wybór imienia — design spec

**Data:** 2026-04-19
**Status:** Approved (pending user review)
**Autor:** Claude + Romek

## Cel

Dodać do aplikacji Ready Daddy funkcję wspólnego losowania imienia dla dziecka.
Rodzice wpisują po 5 typów imion (kolumna mamy, kolumna taty), po czym aplikacja
losuje jedno imię ze wszystkich niepustych pól (obie pule razem).

## User flow

1. Użytkownik wchodzi do HomeScreen i widzi nowy kafelek **"Wybór imienia"** na dole listy kart.
2. Klika kafelek → push do `NameDrawScreen`.
3. Wpisuje imiona w dwóch kolumnach (mama / tata), po 5 pól w każdej. Wszystkie pola opcjonalne.
4. Klika przycisk "Losuj 🎲" (disabled gdy wszystkie pola puste).
5. Otwiera się `NameDrawModal` z animacją slot-machine (~2.5s), zatrzymuje się na wylosowanym imieniu.
6. Pod wynikiem dwa przyciski:
   - "Losuj ponownie" — restartuje animację z nowym wynikiem
   - "Zapisz jako imię dziecka" — zapisuje wynik do profilu (slot `baby_name_1` lub `baby_name_2` wg logiki rotacji, patrz niżej)
7. Użytkownik może też zamknąć modal (tap na tło / X) bez zapisu.
8. Imiona-kandydaci pozostają zapisane lokalnie (AsyncStorage) między sesjami.

## Zakres

### W zakresie

- Nowy kafelek wejściowy na HomeScreen
- Nowy ekran `NameDrawScreen` z dwiema kolumnami input + przycisk losowania
- Nowy modal `NameDrawModal` z animacją slot-machine i wynikiem
- Hook `useNameDrawStorage` — persystencja imion, ostatniego wyniku i slotu rotacji w AsyncStorage
- Integracja przycisku "Zapisz" z istniejącym API `api.updateProfile` (pola `babyName1` / `babyName2`)
- Obsługa `AccessibilityInfo.isReduceMotionEnabled()` (pomija animację)

### Poza zakresem

- Współdzielenie imion między kontami (mama/tata mają osobne urządzenia) — out of scope
- Synchronizacja imion-kandydatów z Supabase — trzymane tylko lokalnie
- Statystyki / historia losowań
- Integracja z listą dzieci / dodawanie wielu dzieci

## Architektura

### Struktura plików

```
mobile/src/
├── screens/
│   └── NameDrawScreen.tsx          # główny ekran z kolumnami input
├── components/
│   └── NameDrawModal.tsx           # modal z animacją i wynikiem
├── hooks/
│   └── useNameDrawStorage.ts       # AsyncStorage I/O (imiona, lastResult, nextSlot)
└── navigation/
    └── AppNavigator.tsx            # dodanie trasy NameDraw do HomeStack
```

### Nawigacja

Nowa trasa `NameDraw` dodana do `HomeStackParamList` (obok `Home`, `Settings`, `WeekDetail`, etc.):

```ts
type HomeStackParamList = {
  // ...existing
  NameDraw: undefined;
};
```

Wejście: z HomeScreen przez `navigation.navigate('NameDraw')`.

### Kafelek na HomeScreen

Dodany na końcu listy kart (poniżej istniejących). Styl spójny z istniejącymi
kartami (`cardBorder`, ikona + tytuł + krótki podtytuł).

- **Tytuł:** "Wybór imienia"
- **Podtytuł:** "Wspólne losowanie imienia dla maluszka"
- **Ikona:** `dice` lub `shuffle` (do wyboru w zależności od dostępności w komponencie `Icon`)

## Komponenty

### `NameDrawScreen`

**Layout (top → bottom):**

1. **Header** — pattern z `AddVisitScreen`: back button + tytuł "Wybór imienia"
2. **Opis** (pod headerem): "Wpiszcie po 5 imion i wylosujcie jedno dla maluszka."
3. **Dwie kolumny** (`flexDirection: 'row'`, `gap: theme.spacing.md`):
   - Lewa: nagłówek "Mama 👩" + 5 `TextInput` (jedno pod drugim)
   - Prawa: nagłówek "Tata 👨" + 5 `TextInput`
   - Bez numeracji pól — wizualny rząd sam w sobie wystarczy
4. **Przycisk "Losuj 🎲"** — primary, pełna szerokość, `disabled` gdy
   `[...mamaNames, ...tataNames].filter(n => n.trim()).length < 1`
5. **Sekcja "Ostatnio wylosowane"** (widoczna tylko jeśli `lastResult`):
   - Tekst: "Ostatnie losowanie: **{name}**"
   - Link: "wyczyść" (`textMuted`, mały font) → `clearLastResult()`

**Input właściwości:**
- `maxLength: 30`
- `autoCapitalize: 'words'`
- `placeholder: "Imię"`
- Każda zmiana → debounce 500ms → zapis do AsyncStorage

**Keyboard handling:** `KeyboardAvoidingView` + `ScrollView` z `keyboardShouldPersistTaps="handled"` (wzorzec z `AddVisitScreen`).

**Obsługa losowania:**
```ts
const handleDraw = () => {
  const pool = [...names.mama, ...names.tata]
    .map(n => n.trim())
    .filter(n => n.length > 0);
  if (pool.length === 0) return;
  const result = pool[Math.floor(Math.random() * pool.length)];
  setLastResult(result);
  setModalVisible(true);
  setModalResult(result);
  setModalPool(pool);
};
```

### `NameDrawModal`

**Props:**
```ts
interface NameDrawModalProps {
  visible: boolean;
  pool: string[];          // imiona do cyklowania w animacji (niepuste, trimmed)
  result: string;          // ostateczny wynik
  onRequestRedraw: () => void;  // parent regeneruje result + pool przed kolejnym draw
  onSave: (name: string) => Promise<void>;  // obsługa zapisu do profilu
  onDismiss: () => void;
}
```

**Struktura wizualna:**

Pełnoekranowy `Modal` (`transparent`, `animationType="fade"`):
- Tło: `rgba(0,0,0,0.85)`
- Na środku: duży `Text` z aktualnie wyświetlanym imieniem
- Nad wynikiem: mały napis "Wylosowane imię:" (`textMuted`)
- Pod wynikiem (widoczne dopiero po fazie 2): dwa przyciski
  - "Losuj ponownie" (secondary / outline)
  - "Zapisz jako imię dziecka" (primary)
- Prawy górny róg: X (close)

**Faza 1 — animacja slot-machine (~2.5s):**

- Przez pierwsze ~2.0s: co 80ms `setState` losowe imię z `pool`
- Ostatnie ~0.5s: interwał rośnie (80 → 150 → 250 → 400ms)
- Ostatnia wartość cyklu = `result`
- Implementacja: rekurencyjny `setTimeout` w `useEffect`, `useRef` na handle do cleanup
- Po zakończeniu: `setIsAnimating(false)` → pojawiają się przyciski

**Faza 2 — wynik:**

- Imię zostaje na ekranie (duża czcionka `fontSize.xxxl`, `fontWeight.bold`, `colors.primary`)
- Opcjonalny subtelny `Animated.spring` scale-up na pojawienie wyniku (1.0 → 1.1 → 1.0)
- Przyciski fade-in (`Animated.timing` opacity 0 → 1, 300ms)

**Reduced motion:**

- Sprawdzenie `AccessibilityInfo.isReduceMotionEnabled()` przy otwarciu modala
- Jeśli `true`: skip Fazy 1, wyświetl wynik natychmiast

**Edge case:** `pool.length === 1` → animacja dalej się odpala (dla spójności UX), ale wszystkie ticki pokazują to samo imię.

**Obsługa "Losuj ponownie":**

- Wywołuje `onRequestRedraw()` — parent `NameDrawScreen` regeneruje nowy `result` (i aktualizuje state), `pool` pozostaje ten sam.
- Modal resetuje wewnętrzny state `isAnimating = true` i restartuje Fazę 1.

### `useNameDrawStorage`

**Klucz AsyncStorage:** `@readyDaddy:nameDraw`

**Schema:**
```ts
interface NameDrawStorage {
  mamaNames: string[];   // zawsze długość 5; puste pole = ''
  tataNames: string[];   // zawsze długość 5; puste pole = ''
  lastResult: string | null;
  nextSlot: 1 | 2;       // który slot babyName nadpisać przy następnym zapisie
                         // gdy oba pola profilu są wypełnione
}
```

**Default (gdy klucz nie istnieje):**
```ts
{
  mamaNames: ['', '', '', '', ''],
  tataNames: ['', '', '', '', ''],
  lastResult: null,
  nextSlot: 1,
}
```

**API hooka:**
```ts
function useNameDrawStorage() {
  return {
    loading: boolean,
    names: { mama: string[]; tata: string[] },
    setName: (column: 'mama' | 'tata', index: number, value: string) => void,  // debounce 500ms
    lastResult: string | null,
    setLastResult: (name: string) => void,  // natychmiastowy zapis
    clearLastResult: () => void,
    nextSlot: 1 | 2,
    advanceSlot: () => void,  // toggle 1 ↔ 2
  };
}
```

**Error handling:** błędy AsyncStorage logowane przez `logError` (zgodnie z CLAUDE.md — "no silent catch").

**Pattern referencyjny:** [mobile/src/hooks/usePersistedChecklist.ts](mobile/src/hooks/usePersistedChecklist.ts)

## Logika zapisu "Zapisz jako imię dziecka"

Przycisk używa istniejącego API `api.updateProfile` + `updateUser` z `AuthContext`.

**Reguły wyboru slotu (`babyName1` vs `babyName2`):**

```
current = { babyName1, babyName2 } z user profilu

jeśli !babyName1 && !babyName2:    → zapisz do babyName1
jeśli babyName1 && !babyName2:     → zapisz do babyName2
jeśli !babyName1 && babyName2:     → zapisz do babyName1
jeśli babyName1 && babyName2:      → tryb rotacji:
                                       target = nextSlot (z storage)
                                       zapisz do babyName{target}
                                       advanceSlot() → toggle 1 ↔ 2
```

**Intencja:** gdy oba pola profilu wypełnione, kolejne zapisy z losowania
rotują między `babyName1` i `babyName2` — 3. zapis nadpisuje babyName1,
4. nadpisuje babyName2, itd.

Gdy użytkownik ręcznie wyczyści imię w Ustawieniach, przy następnym "Zapisz"
wraca do logiki "idź do pustego slotu" (nie rotacja). `nextSlot` nie jest
wtedy używany ani aktualizowany.

**Po zapisie:**
- Alert: "Zapisano ✓" (pattern z istniejącego `SettingsScreen`)
- Zamknięcie modala

**Error handling:** try/catch, na błędzie `Alert.alert('Błąd', 'Nie udało się zapisać imienia.')`, modal pozostaje otwarty.

## Data flow

```
[NameDrawScreen]
  ├── useNameDrawStorage() → names, lastResult, nextSlot
  ├── user input → debounced setName() → AsyncStorage
  ├── klik "Losuj" → pool = filter(names) → result = random(pool)
  │                   → setLastResult(result) → AsyncStorage
  │                   → setModalVisible(true), pass pool + result
  │
  └── [NameDrawModal]
        ├── Faza 1: animacja slot-machine (setTimeout chain)
        ├── Faza 2: pokaż wynik + przyciski
        ├── klik "Losuj ponownie" → onRequestRedraw() → parent regeneruje result → restart animacji
        ├── klik "Zapisz" → obliczenie slotu (babyName1/2) → api.updateProfile → updateUser → advanceSlot (jeśli rotacja) → Alert → zamknięcie modala
        └── tap tło / X → onDismiss → zamknięcie modala (bez zapisu)
```

## Testy

**Warunek:** jeśli `mobile/jest.config.js` istnieje i w repo są działające testy, dodać:

1. **Unit test `useNameDrawStorage`:**
   - Zapis i odczyt imion
   - Debounce (opcjonalnie — jeśli prosto przetestować)
   - `advanceSlot()` toggluje 1 ↔ 2
   - `clearLastResult()` zeruje `lastResult` w storage
   - Default state gdy klucz nie istnieje

2. **Unit test logiki wyboru slotu** (czysta funkcja wydzielona z `NameDrawModal`):
   - 4 przypadki z tabeli logiki zapisu

3. **Unit test funkcji losowania** (czysta funkcja wydzielona):
   - Zwraca element z puli
   - Dla `pool.length === 0` zwraca `null` / rzuca (zależnie od kontraktu)

Jeśli testy nie są obecnie skonfigurowane / niezainicjalizowane — pomijamy, implementacja działa bez testów automatycznych (zgodnie z obecnym stanem projektu mobilnego).

## Konwencje zgodne z CLAUDE.md

- `StyleSheet.create` z patternem `createStyles(theme: Theme)` + `useMemo`
- Kolory/spacing/fonty przez `theme.*`
- Magic numbers → `mobile/src/constants.ts` (np. `NAME_DRAW_SLOTS = 5`, `NAME_DRAW_ANIMATION_TOTAL_MS = 2500`)
- Błędy AsyncStorage → `logError`, żadnych silent `.catch(() => {})`
- Bez `as any` — proper types, `catch (err: unknown)` z `instanceof Error`

## Otwarte pytania

Brak.

## Open risks

- Animacja slot-machine na wolniejszych urządzeniach Androida może mieć lekkie
  stuttery — fallback: jeśli jest problem, przepisać na `Animated.Value` + `interpolate`
  zamiast chain `setTimeout`. Na razie zostawiamy prostszą implementację.
- `maxLength: 30` dla imienia — wystarczające dla polskich imion; gdyby pojawił
  się problem z długimi imionami w stylu "Maria Magdalena", zwiększyć limit.
