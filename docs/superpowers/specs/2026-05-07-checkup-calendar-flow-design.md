# Design: Flow odhaczania badania → kalendarz + dziennik

**Status:** Approved (2026-05-07)
**Scope:** `mobile/` — ekran "Wizyty Lekarskie" (CheckupsScreen)

## Problem

Obecnie checkbox tylko odhacza badanie, a osobny przycisk ikony kalendarza dodaje wydarzenie z dzisiejszą datą o 9:00 — w praktyce bezużyteczne. Komunikat "dodano do kalendarza" pokazuje się przy odhaczeniu, ale faktycznie nic się nie dzieje (mylące UX).

Cel: po odhaczeniu badania pytamy użytkownika, czy dodać do kalendarza. Jeśli tak — pełny formularz z datą/godziną/lekarzem/miejscem. Wpis trafia do kalendarza telefonu (z 3 przypomnieniami) oraz do dziennika użytkownika (zakładka "badania"). Odznaczenie pyta, czy usunąć też wydarzenie z kalendarza.

## Architektura

### Komponenty

1. **CheckupsScreen** (zmieniony, `mobile/src/screens/CheckupsScreen.tsx`)
   - Usuwamy osobny przycisk ikony kalendarza (`s.calBtn`) obok każdego badania.
   - Checkbox staje się jedynym triggerem flow.
   - Dodajemy state machine dla checkbox click: idle-unchecked → confirm-add → (optional) sheet → done; idle-checked → confirm-remove → done.

2. **AddExamSheet** (nowy, `mobile/src/components/checkups/AddExamSheet.tsx`)
   - Modal w stylu `Modal` z RN, `presentationStyle="pageSheet"` na iOS, fullscreen na Android.
   - Wykorzystuje istniejące `GlassCard` + `AuroraBackground`.
   - Pola: data (DateTimePicker), godzina (DateTimePicker), czas trwania (Picker: 30min/1h/1.5h/2h, default 1h), lekarz (TextInput, opcjonalne), miejsce (TextInput, opcjonalne), notatka (TextInput multiline, opcjonalne).
   - Defaulty: data = jutro, godzina = 09:00.
   - Header: Anuluj | Tytuł "Dodaj badanie" | Zapisz.
   - Read-only display: nazwa badania, tydzień ciąży.
   - Stopka: "ℹ Przypomnienia: 2 dni, 1 dzień, 2 godziny przed".

3. **CalendarService** (rozszerzony, `mobile/src/services/calendar/CalendarService.ts`)
   - Nowe metody:
     - `createExamEvent({ title, start, end, doctor?, location?, notes? }): Promise<string | null>` — zwraca eventId lub null jeśli brak permissions/błąd. Tworzy event z 3 alarmami: -2880 min (2 dni), -1440 min (1 dzień), -120 min (2h).
     - `deleteExamEvent(eventId: string): Promise<void>` — łapie błędy "not found" po cichu (logError).

4. **usePersistedChecklist** (rozszerzony, `mobile/src/hooks/usePersistedChecklist.ts`)
   - Migracja state: `Record<string, boolean>` → `Record<string, { checked: boolean; calendarEventId?: string; journalEntryId?: string }>`.
   - Nowe API:
     - `setCheckedWithMeta(key, meta: { calendarEventId?, journalEntryId? })`
     - `getMeta(key): { calendarEventId?, journalEntryId? } | undefined`
   - Migracja: jeśli wartość = boolean, konwertuj do `{ checked: <boolean> }`.

5. **journalStore** (bez zmian, `mobile/src/services/journal/...`)
   - Używamy istniejącego `addEntry` z typem `'exam'`.
   - `linkedExamId` = stabilny klucz `checkup-v{vIdx}-c{cIdx}-i{iIdx}` (lub `checkup-v{vIdx}-cat{cIdx}` dla `singleCheck` kategorii).

### Flow

```
Klik checkbox (niezaznaczone)
  → Alert "Dodać do kalendarza?" [Tak] [Nie]
      ├ Nie  → odhacza. Koniec.
      └ Tak  → odhacza + otwiera AddExamSheet
                  ├ Anuluj → badanie pozostaje odhaczone. Koniec. (per opcja C: zawsze odhacza)
                  └ Zapisz → CalendarService.createExamEvent → eventId
                            → journalStore.addEntry({ type:'exam', linkedExamId, doctor, location, notes, reminder, date, week }) → entryId
                            → setCheckedWithMeta(key, { calendarEventId: eventId, journalEntryId: entryId })

Klik checkbox (zaznaczone)
  → Sprawdź meta:
      ├ Jeśli calendarEventId istnieje → Alert "Usunąć też wydarzenie z kalendarza?" [Tak] [Nie]
      │     ├ Nie  → tylko odznacza badanie.
      │     └ Tak  → odznacza + CalendarService.deleteExamEvent(eventId).
      └ Jeśli brak calendarEventId (stare odhaczenie / sheet anulowany / brak permissions) → po prostu odznacz, bez pytania.
  → W obu przypadkach: wpis w dzienniku **pozostaje**. User usuwa go ręcznie z poziomu dziennika.
```

## Error handling

| Sytuacja | Zachowanie |
|---|---|
| Brak permissions do kalendarza | Alert "Brak uprawnień". `eventId = null`. Wpis w dzienniku tworzony **mimo to**. Badanie odhaczone. Przy odznaczeniu — bez pytania o kalendarz. |
| `Calendar.createEventAsync` rzuca błąd | Alert "Nie udało się dodać wydarzenia". `eventId = null`. Wpis w dzienniku tworzony mimo to. |
| `Calendar.deleteEventAsync` rzuca (event ręcznie usunięty z kalendarza) | `logError` po cichu, kontynuuj odznaczenie. |
| User klika checkbox dwa razy szybko | Modal/Alert są blocking — drugi klik zostaje zignorowany. |
| Stary boolean state w persisted storage | Hook migruje przy load do `{ checked: true }` bez metadanych. |

## Testy

1. **`usePersistedChecklist.test.ts`**
   - Migracja boolean → object.
   - `setCheckedWithMeta` zapisuje IDs, persists przez reload.
   - `getMeta` zwraca undefined dla starych entries po migracji.

2. **`CalendarService.test.ts`**
   - `createExamEvent` woła `Calendar.createEventAsync` z 3 alarmami: -2880, -1440, -120.
   - Brak permissions → zwraca null, woła Alert.
   - `deleteExamEvent` łapie błąd "not found" po cichu.

3. **`CheckupsScreen.test.tsx`** (integration)
   - Klik niezaznaczonego pokazuje dialog "Dodać do kalendarza?".
   - "Nie" → odhacza, brak sheet, brak journal entry.
   - "Tak" → otwiera AddExamSheet.
   - Sheet "Anuluj" → badanie odhaczone, brak entry, brak event.
   - Sheet "Zapisz" → tworzy event + journal entry, IDs persisted w meta.
   - Klik zaznaczonego (z meta) → dialog "Usunąć z kalendarza?".
   - "Tak" → `deleteEventAsync` wywołane, badanie odznaczone.
   - "Nie" → tylko odznacza, event w kalendarzu zostaje.
   - Klik zaznaczonego (bez meta — stare odhaczenie) → odznacza bez pytania.

4. **`AddExamSheet.test.tsx`**
   - Pola opcjonalne mogą być puste.
   - Defaulty: data = jutro, godzina = 09:00, czas trwania = 1h.
   - "Zapisz" emituje payload z poprawnymi typami (Date dla start/end, stringi dla pozostałych).

## Edge cases (świadomie nieobjęte)

- Edycja eventu w kalendarzu z poziomu aplikacji — user edytuje w natywnym kalendarzu telefonu.
- Synchronizacja eventu z dziennikiem po edycji — gdy user zmieni datę w kalendarzu, journal entry nie zaktualizuje się automatycznie.
- Synchronizacja z serwerem (Supabase) — wpis w dzienniku trafia tam zwykłym torem przez istniejący `journalStore`.

## Pliki

**Nowe:**
- `mobile/src/components/checkups/AddExamSheet.tsx`

**Zmienione:**
- `mobile/src/screens/CheckupsScreen.tsx` — usunięcie osobnego przycisku kalendarza, nowa logika checkbox.
- `mobile/src/hooks/usePersistedChecklist.ts` — migracja state, nowe API.
- `mobile/src/services/calendar/CalendarService.ts` — `createExamEvent`, `deleteExamEvent`.

**Zależności:**
- `@react-native-community/datetimepicker` — jeśli nie jest w deps, do dodania.
