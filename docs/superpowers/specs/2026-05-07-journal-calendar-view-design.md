# Design: Kalendarz w dzienniku

**Status:** Approved (2026-05-07)
**Scope:** `mobile/` — JournalScreen + nowe komponenty kalendarza

## Problem

Użytkownik chce widok kalendarza w dzienniku, gdzie dla każdego dnia widzi:
- Pełną datę
- Tydzień i dzień ciąży w formacie "21+3" (dni liczone 0–6)
- Wpisy z dziennika z tego dnia (w tym te utworzone przez CheckupsScreen flow)
- Możliwość dodania nowej wizyty bezpośrednio z kalendarza

Obecnie dziennik ma tylko widok listy z chipami filtrowania.

## Architektura

### Komponenty

1. **JournalScreen** (zmieniony, `mobile/src/screens/journal/JournalScreen.tsx`)
   - Toggle "Lista | Kalendarz" w nagłówku (segmented control).
   - State `view: 'list' | 'calendar'` persistowany w AsyncStorage pod kluczem `journal_view_mode` (default `'list'`).
   - W trybie `'list'` — istniejące zachowanie (filtry + FlatList).
   - W trybie `'calendar'` — renderuje `<JournalCalendarView />`.

2. **JournalCalendarView** (nowy, `mobile/src/components/journal/JournalCalendarView.tsx`)
   - Kontener z stanem: `monthDate` (default = bieżący miesiąc), `selectedDate` (default = today), `pendingDate` (Date | null) dla otwartego sheet'a.
   - Pobiera `entries` z hooka `useJournal()`, grupuje je przez `date` do `entriesByDay: Record<'YYYY-MM-DD', JournalEntry[]>`.
   - Pobiera `conceptionDate` z `AuthContext`.
   - Renderuje: nagłówek miesiąca (◀ Maj 2026 ▶), `<CalendarMonthGrid />`, pod spodem `<CalendarDayDetail />` jeśli `selectedDate` ustawione.
   - Po submit z `AddExamSheet` woła `createExamEvent` + `addJournalEntry({type:'exam',...})` + `reload()` z `useJournal`.

3. **CalendarMonthGrid** (nowy, `mobile/src/components/journal/CalendarMonthGrid.tsx`)
   - Czysta prezentacja: 42 komórki (7 dni × 6 tygodni). Pierwszy dzień siatki = poniedziałek (PL convention).
   - Props: `monthDate: Date`, `selectedDate: Date | null`, `entriesByDay: Record<string, JournalEntry[]>`, `conceptionDate?: string`, `onSelectDay: (date: Date) => void`.
   - Komórka renderuje:
     - Cyfrę dnia (`fontSize.md`, kolor `text` jeśli bieżący miesiąc, `textMuted` jeśli sąsiedni miesiąc, `primary` z tłem jeśli wybrany)
     - "21+3" pod spodem (`fontSize.xs`, `textMuted`); pomijane gdy brak `conceptionDate` lub data poza zakresem ciąży
     - Kropkę 4px `primary` jeśli `entriesByDay[isoDate].length > 0`
     - Today: outline 1.5px `primary` wokół cyfry (gdy nie wybrany)
   - Klik komórki → `onSelectDay(date)`.

4. **CalendarDayDetail** (nowy, `mobile/src/components/journal/CalendarDayDetail.tsx`)
   - Inline expansion pod siatką. Animacja `LayoutAnimation.easeInEaseOut`.
   - Props: `date: Date`, `entries: JournalEntry[]`, `weekDay?: { week: number; day: number }`, `onAddVisit: () => void`, `onEntryPress: (entryId: string) => void`.
   - Layout: nagłówek "Czwartek, 7 maja 2026 · 20+0", `EntryCard` per wpis, button "+ Dodaj wizytę".

5. **`pregnancyWeek` util** (nowy, `mobile/src/utils/pregnancyWeek.ts`)
   - `getPregnancyWeekAndDay(conceptionDate: string, target: Date): { week: number; day: number } | null`
     - Zwraca `null` jeśli `target` przed poczęciem (po uwzględnieniu offsetu).
     - Clampuje wynik do `{week: MAX_PREGNANCY_WEEK, day: 0}` dla dat po 40+0.
     - Implementacja:
       ```ts
       const conception = new Date(conceptionDate);
       const diffMs = target.getTime() - conception.getTime();
       const diffDays = Math.floor(diffMs / 86400000);
       const totalDays = diffDays + CONCEPTION_OFFSET_WEEKS * 7;
       if (totalDays < 0) return null;
       const week = Math.floor(totalDays / 7);
       const day = totalDays % 7;
       if (week >= MAX_PREGNANCY_WEEK) return { week: MAX_PREGNANCY_WEEK, day: 0 };
       return { week, day };
       ```
   - `formatWeekDay({week, day}): string` → `"${week}+${day}"`

6. **AddExamSheet** (zmieniony, `mobile/src/components/checkups/AddExamSheet.tsx`)
   - Dodany opcjonalny prop `defaultDate?: Date`.
   - W `useState<Date>(...)` initial value: `defaultDate ?? tomorrowAt9()`. Jeśli `defaultDate` podana, godzina ustawiona na 09:00 tego dnia (przez `setHours(9, 0, 0, 0)` na kopii).
   - W `useEffect` reset state używa tej samej logiki.
   - Backward-compat: gdy brak `defaultDate`, zachowanie bez zmian (tomorrow 09:00).

### Data flow

```
JournalScreen mount
  → odczyt journal_view_mode z AsyncStorage → setView('list' | 'calendar')
  → zmiana toggle → zapis do AsyncStorage

W trybie 'calendar':
  → useJournal() entries
  → JournalCalendarView grupuje entries → entriesByDay
  → conceptionDate z AuthContext
  → użytkownik klika dzień → setSelectedDate
  → CalendarDayDetail filtruje entriesByDay[isoDate]
  → klik "+ Dodaj wizytę" → setPendingDate(selectedDate) → AddExamSheet visible
  → submit AddExamSheet:
      → createExamEvent({ title: `Badanie: ${userInput}`, start, end, ... })
        UWAGA: nie mamy nazwy badania z roadmapy — userInput pochodzi z nowego pola "nazwa" w sheet (patrz Otwarte kwestie)
      → addJournalEntry({ type: 'exam', title, date, doctor, location, notes, ... linkedExamId: undefined })
      → reload() z useJournal()
      → setPendingDate(null)
```

### Otwarte kwestie

**Sheet wymaga nazwy badania.** Obecny `AddExamSheet` przyjmuje `examName` jako prop (read-only). Z poziomu kalendarza nie ma predefiniowanej nazwy — user wpisuje ją sam. Dodajemy do sheet'a opcjonalne zachowanie: gdy `examName` nie jest przekazany lub gdy nowy prop `editableName: boolean` jest true, pokazujemy `TextInput` zamiast read-only Text.

Decyzja: zmieniamy `examName` na zawsze obecne (nazwa badania) plus dodajemy `editableName?: boolean` (default false). W kalendarzu przekazujemy `examName=""` i `editableName={true}`. Walidacja: jeśli editable i puste — przycisk "Zapisz" disabled.

## Error handling

| Sytuacja | Zachowanie |
|---|---|
| Brak `conceptionDate` w profilu | Kalendarz renderuje cyfry dni bez "21+3". Bez błędu. |
| Data przed poczęciem | `getPregnancyWeekAndDay` zwraca null → komórka bez etykiety. |
| Data po 40+0 | Etykieta "40+0" (clamp). |
| AsyncStorage failure (load `journal_view_mode`) | Default `'list'`, błąd przez `logError`. |
| `createExamEvent` zwraca null (denied permission/error) | Alert "Brak wydarzenia w kalendarzu", journal entry tworzony mimo to. (Spójne z CheckupsScreen flow.) |
| `addJournalEntry` rzuca | `logError`, brak reload, sheet zostaje zamknięty. User może retry. |

## Testy

1. **`pregnancyWeek.test.ts`**
   - Conception 2026-01-01, target 2026-01-22 (21 dni od poczęcia, +14 offset = 35 dni = 5+0)
   - Target przed poczęciem → null
   - Target po 40+0 (np. 41 tygodni od poczęcia) → `{week: 40, day: 0}`
   - `formatWeekDay({week:21, day:3})` === "21+3"
   - `formatWeekDay({week:22, day:0})` === "22+0"

2. **`CalendarMonthGrid.test.tsx`**
   - Renderuje 42 komórki niezależnie od miesiąca
   - Pierwszy dzień siatki dla maja 2026 (1.05 = piątek) → 28 kwietnia (poniedziałek)
   - Komórki sąsiednich miesięcy mają opacity/dimmed kolor
   - Klik komórki woła `onSelectDay` z prawidłowym Date
   - Komórka z `entriesByDay[date].length > 0` ma kropkę
   - Komórka bez wpisów nie ma kropki
   - "21+3" pokazuje się gdy `conceptionDate` podany i data w zakresie
   - Brak "21+3" gdy data poza zakresem lub brak `conceptionDate`

3. **`JournalCalendarView.test.tsx`** (integration z mock useJournal + Auth)
   - Default selectedDate = today, monthDate = current month
   - Klik strzałki ▶ → monthDate += 1 miesiąc
   - Klik strzałki ◀ → monthDate -= 1 miesiąc
   - Klik dnia → CalendarDayDetail rozwija się z wpisami z tego dnia
   - Klik "+ Dodaj wizytę" → AddExamSheet visible z `defaultDate=selectedDate`
   - Submit sheet (z nazwą "USG", godzina 10:00) → `createExamEvent` + `addJournalEntry` wywołane z poprawnymi argumentami
   - Submit z pustą nazwą → button disabled (sheet)

4. **`AddExamSheet.test.tsx`** (rozszerzony)
   - Z `defaultDate` ustawia start na podaną datę, godzina 09:00
   - Bez `defaultDate` → tomorrow 09:00 (istniejący test)
   - Z `editableName={true}` i `examName=""` → renderuje TextInput, button "Zapisz" disabled
   - Z `editableName={true}` i wpisaną nazwą → button enabled, submit zawiera nazwę

5. **`JournalScreen.test.tsx`** (nowy lub rozszerzony)
   - Toggle "Lista | Kalendarz" przełącza renderowany widok
   - Stan persistowany: po reload screen'a, ostatnio wybrany widok jest aktywny
   - Default `'list'` przy pierwszym uruchomieniu

## Edge cases (świadomie nieobjęte)

- Swipe horyzontalny między miesiącami — odłożone (YAGNI), pierwsza wersja używa strzałek
- Filtrowanie per typ wpisu w widoku kalendarza — chip filter pozostaje tylko w widoku listy
- Wpisy wielo-dniowe — schema dziennika ma jedną datę, nie obsługujemy
- Heatmap intensywności kropki — jedna kropka wystarczy w MVP
- Migracja istniejących wpisów typu `'visit'` do `'exam'` — out of scope tego ficzeru. Punkt użytkownika "ujednolicamy w ogóle exam i visit do samego exam" dotyczy tylko nowo tworzonych wpisów. Stare 'visit' pozostają.

## Pliki

**Nowe:**
- `mobile/src/utils/pregnancyWeek.ts`
- `mobile/src/utils/__tests__/pregnancyWeek.test.ts`
- `mobile/src/components/journal/CalendarMonthGrid.tsx`
- `mobile/src/components/journal/CalendarDayDetail.tsx`
- `mobile/src/components/journal/JournalCalendarView.tsx`
- `mobile/src/components/journal/__tests__/CalendarMonthGrid.test.tsx`
- `mobile/src/components/journal/__tests__/JournalCalendarView.test.tsx`

**Zmienione:**
- `mobile/src/screens/journal/JournalScreen.tsx` — toggle Lista/Kalendarz, persisted view
- `mobile/src/components/checkups/AddExamSheet.tsx` — `defaultDate?: Date`, `editableName?: boolean`
- `mobile/src/components/checkups/__tests__/AddExamSheet.test.tsx` — nowe testy

**Zależności:** brak nowych — używamy istniejących bibliotek (date Date, AsyncStorage, theme).
