# Design: Dodawanie wizyt do kalendarza

**Data:** 2026-04-17  
**Zakres:** `mobile/` — nowy ekran AddVisit + integracja z systemowym kalendarzem

---

## Cel

Przycisk `calendar_add` na głównym ekranie otwiera formularz nowej wizyty. Po zapisaniu: tworzy wpis typu `visit` w dzienniku oraz wydarzenie w systemowym kalendarzu telefonu.

---

## Architektura

### Nowe pliki

- `mobile/src/screens/AddVisitScreen.tsx` — formularz wizyty
- `mobile/src/services/calendar/CalendarService.ts` — wrapper na `expo-calendar`

### Modyfikowane pliki

- `mobile/src/types/navigation.ts` — dodanie `AddVisit: undefined` do `HomeStackParamList`
- `mobile/src/navigation/AppNavigator.tsx` — rejestracja `AddVisitScreen` w `HomeStack`
- `mobile/src/screens/HomeScreen.tsx` — przycisk calendar_add w headerze, settings na dole
- `mobile/src/components/Icon.tsx` — dodanie wpisu `calendar-add` do `ICON_MAP`

---

## Formularz AddVisitScreen

| Pole | Typ inputu | Domyślnie | Wymagane |
|------|-----------|-----------|----------|
| Tytuł | TextInput | puste | tak |
| Data | TextInput (YYYY-MM-DD) | dzisiaj | tak |
| Godzina | TextInput (HH:MM) | puste | nie |
| Czas trwania | chipy: 15 min / 30 min / 45 min / 1h / 2h | 30 min | tak |
| Tydzień ciąży | TextInput numeric | `currentWeek + 1` | nie |
| Lekarz | TextInput | puste | nie |
| Placówka | TextInput | puste | nie |
| Notatki | TextInput multiline | puste | nie |

`currentWeek` pochodzi z `useCurrentWeek(user?.conceptionDate)`.

---

## CalendarService

```ts
// mobile/src/services/calendar/CalendarService.ts
addEvent(params: {
  title: string;
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:MM — jeśli brak → allDay: true
  durationMinutes: number;
  location?: string;
  doctor?: string;
  notes?: string;
}): Promise<string | null>  // zwraca eventId lub null gdy brak uprawnień
```

**Logika:**
1. `Calendar.requestCalendarPermissionsAsync()` — jeśli odmowa → zwraca `null`
2. Szuka kalendarza o nazwie `"Ready Daddy"` wśród lokalnych kalendarzy
3. Jeśli nie istnieje → tworzy nowy lokalny kalendarz `"Ready Daddy"`
4. Tworzy event: `startDate` = data + godzina, `endDate` = startDate + durationMinutes, `location` = placówka, `notes` = `Lekarz: {doctor}\n{notes}` (pomija puste pola)
5. Zwraca `eventId`

---

## Flow zapisu w AddVisitScreen

1. Walidacja: tytuł niepusty
2. `CalendarService.addEvent(...)` → jeśli `null` (brak uprawnień) → Alert: *"Brak dostępu do kalendarza. Wizyta zostanie zapisana tylko w dzienniku."* → kontynuuje
3. `useJournal().add({ type: 'visit', title, date, week, doctor, location, notes })`
4. `navigation.goBack()`

---

## Zmiany HomeScreen

**Header:**
- Ikona `gear` (settings) → zastąpiona ikoną `calendar-add` → `navigation.navigate('AddVisit')`

**Dół ekranu** (przed `<View style={{ height: 20 }} />`):
```tsx
<TouchableOpacity
  onPress={() => navigation.navigate('Settings')}
  style={s.settingsFooter}
>
  <Icon name="gear" size={16} color={theme.colors.textMuted} />
  <Text style={s.settingsFooterLabel}>Ustawienia</Text>
</TouchableOpacity>
```
Styl: subtelny, wyśrodkowany, `textMuted`.

---

## Icon.tsx

Dodać do `ICON_MAP`:
```ts
'calendar-add': { set: 'mi', name: 'edit-calendar' },
```

---

## Uprawnienia

`expo-calendar` jest już w `package.json`. Brak nowych zależności.  
Na Android: uprawnienie `READ_CALENDAR` + `WRITE_CALENDAR` — `expo-calendar` pyta automatycznie przez `requestCalendarPermissionsAsync()`.

---

## Co NIE wchodzi w scope

- Edycja istniejącego eventu w kalendarzu (tylko tworzenie)
- Synchronizacja zmian z dziennika do kalendarza
- Widok kalendarza w aplikacji
