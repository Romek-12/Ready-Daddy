# Design: Date/Time Pickery w notatniku i AddVisit

**Data:** 2026-04-17  
**Zakres:** `mobile/` — własne komponenty DatePickerModal i TimePickerModal, integracja w AddEntryScreen i AddVisitScreen

---

## Cel

Zastąpić ręczne wpisywanie daty (YYYY-MM-DD) i godziny (HH:MM) własnym UI opartym na:
- siatce kalendarza (`react-native-calendars`) dla daty
- rolowanych bębnach (FlatList) dla czasu

---

## Architektura

### Nowe pliki

- `mobile/src/components/DatePickerModal.tsx` — modal z siatką kalendarza
- `mobile/src/components/TimePickerModal.tsx` — modal z dwoma spinnerami

### Modyfikowane pliki

- `mobile/src/screens/journal/AddEntryScreen.tsx` — pole Data → przycisk + DatePickerModal
- `mobile/src/screens/AddVisitScreen.tsx` — pole Data → DatePickerModal, pole Godzina → TimePickerModal

### Instalacja

`react-native-calendars` jest w `package.json` ale nie zainstalowane. Krok instalacji: `npm install` w `mobile/`.

---

## Komponent DatePickerModal

### Interfejs

```tsx
interface DatePickerModalProps {
  visible: boolean;
  value: string;           // YYYY-MM-DD
  onConfirm: (date: string) => void;
  onDismiss: () => void;
}
```

### Wygląd

- Ciemny półprzezroczysty overlay (`rgba(0,0,0,0.5)`) pokrywający cały ekran
- Biały/surface modal wyśrodkowany, `borderRadius: xl`, `padding: lg`
- Nagłówek: `<` [miesiąc rok po polsku] `>` — strzałki zmieniają aktualnie wyświetlany miesiąc
- Siatka `<Calendar>` z `react-native-calendars`:
  - `hideArrows: true` (własna nawigacja w nagłówku)
  - `markedDates` podświetla wybrany dzień kolorem `theme.colors.primary`
  - `theme` zsynchronizowany z paletą aplikacji (tło, tekst, primary)
- Dwa przyciski na dole: "Anuluj" (textMuted) i "Gotowe" (primary)

### Zachowanie

- Otwarcie modalu → wyświetla miesiąc aktualnie wybranej daty (`value`)
- Kliknięcie dnia → zaznaczenie (lokalny state), nie zamyka modalu
- "Gotowe" → `onConfirm(selectedDate)` gdzie `selectedDate` to YYYY-MM-DD
- "Anuluj" / tap overlay → `onDismiss()`, bez zmiany wartości

### Przycisk wywołujący (w formularzach)

Prostokąt stylowany identycznie jak istniejące `input` (surface, border, borderRadius.md), z:
- Ikoną `calendar` po lewej (color: textMuted)
- Tekstem daty w formacie `DD.MM.YYYY` (color: text) lub placeholder "np. 2026-05-01" (color: textMuted)

---

## Komponent TimePickerModal

### Interfejs

```tsx
interface TimePickerModalProps {
  visible: boolean;
  value: string;           // HH:MM lub '' (puste = brak godziny)
  onConfirm: (time: string) => void;
  onDismiss: () => void;
}
```

### Wygląd

- Ten sam styl overlay i modal co DatePickerModal
- Dwa bębny obok siebie z separatorem `:` pośrodku
- Lewy bęben: godziny 00–23 (24 pozycje)
- Prawy bęben: minuty 00, 05, 10, ... 55 (12 pozycji)
- Każdy bęben: `FlatList` z `snapToInterval`, widoczne 5 pozycji jednocześnie, środkowa = wybrana
- Wybrany element: kolor `primary`, większy fontSize, pogrubiony
- Pozostałe elementy: kolor textMuted, normalny fontSize
- Dwa przyciski na dole: "Anuluj" i "Gotowe"

### Zachowanie

- Otwarcie → ustawia bębny na aktualną wartość `value` (jeśli puste → 09:00 jako default display)
- Scrollowanie bębna → zmiana lokalnego state (godzina lub minuta)
- "Gotowe" → `onConfirm("HH:MM")` (zero-padded)
- "Anuluj" → `onDismiss()`

### Przycisk wywołujący (w AddVisitScreen)

Prostokąt jak `input`, z:
- Ikoną `schedule` po lewej (color: textMuted)  
- Tekstem czasu "HH:MM" (color: text) lub placeholder "np. 14:30" (color: textMuted)

---

## Zmiany w formularzach

### AddEntryScreen (`mobile/src/screens/journal/AddEntryScreen.tsx`)

Zastąpić:
```tsx
<Text style={s.label}>Data</Text>
<TextInput style={s.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" ... />
```

Na:
```tsx
<Text style={s.label}>Data</Text>
<DatePickerButton value={date} onPress={() => setDatePickerVisible(true)} />
<DatePickerModal
  visible={datePickerVisible}
  value={date}
  onConfirm={(d) => { setDate(d); setDatePickerVisible(false); }}
  onDismiss={() => setDatePickerVisible(false)}
/>
```

Dodać state: `const [datePickerVisible, setDatePickerVisible] = useState(false)`

### AddVisitScreen (`mobile/src/screens/AddVisitScreen.tsx`)

Pole Data — analogicznie jak AddEntryScreen.

Pole Godzina — zastąpić `TextInput` na:
```tsx
<TimePickerButton value={time} onPress={() => setTimePickerVisible(true)} />
<TimePickerModal
  visible={timePickerVisible}
  value={time}
  onConfirm={(t) => { setTime(t); setTimePickerVisible(false); }}
  onDismiss={() => setTimePickerVisible(false)}
/>
```

Dodać state: `const [timePickerVisible, setTimePickerVisible] = useState(false)`

---

## Icon.tsx

Dodać do ICON_MAP:
```ts
'schedule': { set: 'mi', name: 'schedule' },
```

---

## Co NIE wchodzi w scope

- Walidacja formatu daty/czasu (pickery gwarantują poprawny format)
- Obsługa zakresów dat (min/max date) — nie wymagane
- Animacje modalu
