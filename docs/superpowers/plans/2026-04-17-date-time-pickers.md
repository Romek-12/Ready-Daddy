# Date/Time Pickers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zastąpić ręczne pola tekstowe daty i godziny w AddEntryScreen i AddVisitScreen własnymi modalami — siatką kalendarza (react-native-calendars) i spinnerami bębnów.

**Architecture:** Dwa nowe reużywalne komponenty modalne: `DatePickerModal` (react-native-calendars Calendar + własna nawigacja miesiąca) i `TimePickerModal` (dwa FlatList bębny). Formularze AddEntryScreen i AddVisitScreen wymieniają TextInput na przyciski otwierające te modale.

**Tech Stack:** React Native 0.81, Expo 54, TypeScript, react-native-calendars (w package.json, wymaga npm install), FlatList z snapToInterval dla spinnerów.

---

## File Map

| Plik | Akcja | Odpowiedzialność |
|------|-------|-----------------|
| `mobile/src/components/DatePickerModal.tsx` | Create | Modal z siatką kalendarza, interfejs DatePickerModalProps |
| `mobile/src/components/TimePickerModal.tsx` | Create | Modal z bębnami godzin/minut, interfejs TimePickerModalProps |
| `mobile/src/components/Icon.tsx` | Modify | Dodanie `schedule` i `calendar` do ICON_MAP |
| `mobile/src/screens/journal/AddEntryScreen.tsx` | Modify | Pole Data → DatePickerModal |
| `mobile/src/screens/AddVisitScreen.tsx` | Modify | Pole Data → DatePickerModal, Godzina → TimePickerModal |

---

## Task 1: Instalacja i ikony

**Files:**
- Modify: `mobile/src/components/Icon.tsx`

- [ ] **Krok 1: Zainstaluj react-native-calendars**

```bash
cd /c/Dev/mobile && npm install
```

Oczekiwany wynik: `react-native-calendars` pojawia się w `node_modules/`.

Weryfikacja:
```bash
ls /c/Dev/mobile/node_modules/react-native-calendars/package.json
```

- [ ] **Krok 2: Dodaj ikony `calendar` i `schedule` do Icon.tsx**

W `mobile/src/components/Icon.tsx`, w sekcji `// Misc`, po `'calendar-add'` dodaj:

```typescript
  'schedule': { set: 'mi', name: 'schedule' },
```

Ikona `calendar` już istnieje w ICON_MAP (jako `{ set: 'mi', name: 'event' }`). Sprawdź czy jest — jeśli nie ma pod kluczem `'calendar'`, dodaj:

```typescript
  'calendar': { set: 'mi', name: 'event' },
```

- [ ] **Krok 3: TypeScript check**

```bash
cd /c/Dev/mobile && npx tsc --noEmit 2>&1 | head -10
```

Oczekiwany wynik: brak nowych błędów.

- [ ] **Krok 4: Commit**

```bash
cd /c/Dev/mobile && git add src/components/Icon.tsx package-lock.json
git commit -m "feat: install react-native-calendars, add schedule icon"
```

---

## Task 2: DatePickerModal

**Files:**
- Create: `mobile/src/components/DatePickerModal.tsx`

- [ ] **Krok 1: Stwórz DatePickerModal.tsx**

```typescript
// mobile/src/components/DatePickerModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '../context/ThemeContext';

const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

interface DatePickerModalProps {
  visible: boolean;
  value: string;        // YYYY-MM-DD
  onConfirm: (date: string) => void;
  onDismiss: () => void;
}

export default function DatePickerModal({ visible, value, onConfirm, onDismiss }: DatePickerModalProps) {
  const { theme } = useTheme();

  const [selected, setSelected] = useState(value || new Date().toISOString().slice(0, 10));
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = value || new Date().toISOString().slice(0, 10);
    return d.slice(0, 7); // YYYY-MM
  });

  useEffect(() => {
    if (visible) {
      const d = value || new Date().toISOString().slice(0, 10);
      setSelected(d);
      setCurrentMonth(d.slice(0, 7));
    }
  }, [visible, value]);

  const [year, month] = currentMonth.split('-').map(Number);

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const markedDates = selected
    ? { [selected]: { selected: true, selectedColor: theme.colors.primary } }
    : {};

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={s.overlay} onPress={onDismiss}>
        <Pressable style={[s.modal, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl }]}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={prevMonth} style={s.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[s.navArrow, { color: theme.colors.text }]}>{'‹'}</Text>
            </TouchableOpacity>
            <Text style={[s.monthLabel, { color: theme.colors.text }]}>
              {MONTHS_PL[month - 1]} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={s.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[s.navArrow, { color: theme.colors.text }]}>{'›'}</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar grid */}
          <Calendar
            key={currentMonth}
            current={currentMonth + '-01'}
            hideArrows
            hideExtraDays
            onDayPress={(day: { dateString: string }) => setSelected(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: theme.colors.surface,
              calendarBackground: theme.colors.surface,
              dayTextColor: theme.colors.text,
              textDisabledColor: theme.colors.textMuted,
              monthTextColor: 'transparent',
              arrowColor: theme.colors.primary,
              todayTextColor: theme.colors.primary,
              selectedDayTextColor: theme.colors.background,
              selectedDayBackgroundColor: theme.colors.primary,
              textDayFontSize: 14,
              textMonthFontSize: 0,
              textDayHeaderFontSize: 12,
              'stylesheet.calendar.header': {
                header: { height: 0, overflow: 'hidden' },
              },
            }}
          />

          {/* Buttons */}
          <View style={s.buttons}>
            <TouchableOpacity onPress={onDismiss} style={s.btnCancel}>
              <Text style={[s.btnCancelText, { color: theme.colors.textMuted }]}>Anuluj</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onConfirm(selected)}
              style={[s.btnConfirm, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={[s.btnConfirmText, { color: theme.colors.background }]}>Gotowe</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  navBtn: { padding: 4 },
  navArrow: { fontSize: 24, fontWeight: '300' },
  monthLabel: { fontSize: 16, fontWeight: '600' },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 12,
  },
  btnCancel: { paddingHorizontal: 16, paddingVertical: 10 },
  btnCancelText: { fontSize: 14, fontWeight: '600' },
  btnConfirm: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  btnConfirmText: { fontSize: 14, fontWeight: '600' },
});
```

- [ ] **Krok 2: TypeScript check**

```bash
cd /c/Dev/mobile && npx tsc --noEmit 2>&1 | head -20
```

Oczekiwany wynik: brak błędów w nowym pliku. Jeśli są błędy TypeScript z react-native-calendars (np. brakujące typy), zainstaluj typy lub dodaj `// @ts-ignore` przy imporcie.

- [ ] **Krok 3: Commit**

```bash
cd /c/Dev/mobile && git add src/components/DatePickerModal.tsx
git commit -m "feat: add DatePickerModal with react-native-calendars"
```

---

## Task 3: TimePickerModal

**Files:**
- Create: `mobile/src/components/TimePickerModal.tsx`

- [ ] **Krok 1: Stwórz TimePickerModal.tsx**

```typescript
// mobile/src/components/TimePickerModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const SPINNER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

interface TimePickerModalProps {
  visible: boolean;
  value: string;        // HH:MM lub ''
  onConfirm: (time: string) => void;
  onDismiss: () => void;
}

function Drum({
  items,
  selectedIndex,
  onSelect,
}: {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const { theme } = useTheme();
  const listRef = useRef<FlatList>(null);
  const lastIndex = useRef(selectedIndex);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToIndex({ index: selectedIndex, animated: false });
    }
    lastIndex.current = selectedIndex;
  }, [selectedIndex]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    onSelect(clamped);
    lastIndex.current = clamped;
  };

  return (
    <View style={[ds.drum, { borderColor: theme.colors.cardBorder }]}>
      {/* Selection highlight */}
      <View style={[
        ds.highlight,
        { borderColor: theme.colors.primary, top: ITEM_HEIGHT * 2 }
      ]} />
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        renderItem={({ item, index }) => {
          const isSelected = index === lastIndex.current;
          return (
            <TouchableOpacity
              style={ds.item}
              onPress={() => {
                onSelect(index);
                listRef.current?.scrollToIndex({ index, animated: true });
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                ds.itemText,
                { color: isSelected ? theme.colors.primary : theme.colors.textMuted },
                isSelected && ds.itemTextSelected,
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

export default function TimePickerModal({ visible, value, onConfirm, onDismiss }: TimePickerModalProps) {
  const { theme } = useTheme();

  const parseValue = (v: string) => {
    if (!v) return { h: 9, m: 0 };
    const [hh, mm] = v.split(':').map(Number);
    const mIndex = Math.round((mm ?? 0) / 5);
    return { h: hh ?? 9, m: Math.min(mIndex, 11) };
  };

  const [hourIndex, setHourIndex] = useState(() => parseValue(value).h);
  const [minIndex, setMinIndex] = useState(() => parseValue(value).m);

  useEffect(() => {
    if (visible) {
      const { h, m } = parseValue(value);
      setHourIndex(h);
      setMinIndex(m);
    }
  }, [visible, value]);

  const handleConfirm = () => {
    onConfirm(`${HOURS[hourIndex]}:${MINUTES[minIndex]}`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={ts.overlay} onPress={onDismiss}>
        <Pressable style={[ts.modal, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl }]}>
          <Text style={[ts.title, { color: theme.colors.text }]}>Wybierz godzinę</Text>

          <View style={ts.drums}>
            <Drum items={HOURS} selectedIndex={hourIndex} onSelect={setHourIndex} />
            <Text style={[ts.separator, { color: theme.colors.text }]}>:</Text>
            <Drum items={MINUTES} selectedIndex={minIndex} onSelect={setMinIndex} />
          </View>

          <View style={ts.buttons}>
            <TouchableOpacity onPress={onDismiss} style={ts.btnCancel}>
              <Text style={[ts.btnCancelText, { color: theme.colors.textMuted }]}>Anuluj</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[ts.btnConfirm, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={[ts.btnConfirmText, { color: theme.colors.background }]}>Gotowe</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const ds = StyleSheet.create({
  drum: {
    width: 72,
    height: SPINNER_HEIGHT,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 8,
  },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    zIndex: 1,
    pointerEvents: 'none',
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 20,
    fontWeight: '400',
  },
  itemTextSelected: {
    fontSize: 24,
    fontWeight: '700',
  },
});

const ts = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 320,
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  drums: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  separator: {
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 8,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 20,
  },
  btnCancel: { paddingHorizontal: 16, paddingVertical: 10 },
  btnCancelText: { fontSize: 14, fontWeight: '600' },
  btnConfirm: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  btnConfirmText: { fontSize: 14, fontWeight: '600' },
});
```

- [ ] **Krok 2: TypeScript check**

```bash
cd /c/Dev/mobile && npx tsc --noEmit 2>&1 | head -20
```

Oczekiwany wynik: brak błędów w nowym pliku.

- [ ] **Krok 3: Commit**

```bash
cd /c/Dev/mobile && git add src/components/TimePickerModal.tsx
git commit -m "feat: add TimePickerModal with drum spinners"
```

---

## Task 4: Integracja w AddEntryScreen

**Files:**
- Modify: `mobile/src/screens/journal/AddEntryScreen.tsx`

- [ ] **Krok 1: Dodaj import**

Na początku pliku, po istniejących importach dodaj:
```typescript
import DatePickerModal from '../../components/DatePickerModal';
```

- [ ] **Krok 2: Dodaj state dla widoczności modalu**

Po linii `const [photos, setPhotos] = useState<string[]>([]);` dodaj:
```typescript
const [datePickerVisible, setDatePickerVisible] = useState(false);
```

- [ ] **Krok 3: Zastąp TextInput daty przyciskiem + modalem**

Znajdź blok (około linia 194–204):
```tsx
        {/* Date */}
        <Text style={s.label}>Data</Text>
        <TextInput
          style={s.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          maxLength={10}
        />
```

Zastąp:
```tsx
        {/* Date */}
        <Text style={s.label}>Data</Text>
        <TouchableOpacity
          style={s.input}
          onPress={() => setDatePickerVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={{ color: date ? theme.colors.text : theme.colors.textMuted, fontSize: theme.fontSize.md }}>
            {date ? date.split('-').reverse().join('.') : 'np. 2026-05-01'}
          </Text>
        </TouchableOpacity>
        <DatePickerModal
          visible={datePickerVisible}
          value={date}
          onConfirm={(d) => { setDate(d); setDatePickerVisible(false); }}
          onDismiss={() => setDatePickerVisible(false)}
        />
```

- [ ] **Krok 4: Upewnij się że `TouchableOpacity` jest w importach**

`TouchableOpacity` jest już w importach z `react-native` w AddEntryScreen. Sprawdź — jeśli nie ma, dodaj.

- [ ] **Krok 5: TypeScript check**

```bash
cd /c/Dev/mobile && npx tsc --noEmit 2>&1 | head -20
```

Oczekiwany wynik: brak nowych błędów.

- [ ] **Krok 6: Commit**

```bash
cd /c/Dev/mobile && git add src/screens/journal/AddEntryScreen.tsx
git commit -m "feat: replace date TextInput with DatePickerModal in AddEntryScreen"
```

---

## Task 5: Integracja w AddVisitScreen

**Files:**
- Modify: `mobile/src/screens/AddVisitScreen.tsx`

- [ ] **Krok 1: Dodaj importy**

Po istniejących importach dodaj:
```typescript
import DatePickerModal from '../components/DatePickerModal';
import TimePickerModal from '../components/TimePickerModal';
```

- [ ] **Krok 2: Usuń `TextInput` z importów jeśli przestanie być używany**

Po wszystkich zmianach sprawdź czy `TextInput` jest jeszcze używany w pliku (jest — dla pól tytuł, tydzień, lekarz, placówka, notatki). Zostaw.

- [ ] **Krok 3: Dodaj stany dla widoczności modali**

Po linii `const [saving, setSaving] = useState(false);` dodaj:
```typescript
const [datePickerVisible, setDatePickerVisible] = useState(false);
const [timePickerVisible, setTimePickerVisible] = useState(false);
```

- [ ] **Krok 4: Zastąp pole Data**

Znajdź w JSX blok z `View style={s.row}` zawierający dwa `rowHalf` z polami Data i Godzina:
```tsx
        <View style={s.row}>
          <View style={s.rowHalf}>
            <Text style={s.label}>Data</Text>
            <TextInput
              style={s.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
          <View style={s.rowHalf}>
            <Text style={s.label}>Godzina</Text>
            <TextInput
              style={s.input}
              value={time}
              onChangeText={setTime}
              placeholder="np. 14:30"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
        </View>
```

Zastąp całym blokiem:
```tsx
        <View style={s.row}>
          <View style={s.rowHalf}>
            <Text style={s.label}>Data</Text>
            <TouchableOpacity
              style={s.input}
              onPress={() => setDatePickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: date ? theme.colors.text : theme.colors.textMuted, fontSize: theme.fontSize.md }}>
                {date ? date.split('-').reverse().join('.') : 'np. 2026-05-01'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={s.rowHalf}>
            <Text style={s.label}>Godzina</Text>
            <TouchableOpacity
              style={s.input}
              onPress={() => setTimePickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: time ? theme.colors.text : theme.colors.textMuted, fontSize: theme.fontSize.md }}>
                {time || 'np. 14:30'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <DatePickerModal
          visible={datePickerVisible}
          value={date}
          onConfirm={(d) => { setDate(d); setDatePickerVisible(false); }}
          onDismiss={() => setDatePickerVisible(false)}
        />
        <TimePickerModal
          visible={timePickerVisible}
          value={time}
          onConfirm={(t) => { setTime(t); setTimePickerVisible(false); }}
          onDismiss={() => setTimePickerVisible(false)}
        />
```

- [ ] **Krok 5: TypeScript check**

```bash
cd /c/Dev/mobile && npx tsc --noEmit 2>&1 | head -20
```

Oczekiwany wynik: brak nowych błędów.

- [ ] **Krok 6: Commit**

```bash
cd /c/Dev/mobile && git add src/screens/AddVisitScreen.tsx
git commit -m "feat: replace date/time TextInputs with pickers in AddVisitScreen"
```

---

## Task 6: Weryfikacja końcowa

- [ ] **Krok 1: Pełny TypeScript check**

```bash
cd /c/Dev/mobile && npx tsc --noEmit 2>&1
```

Oczekiwany wynik: brak nowych błędów (pre-egzystujące błędy w HomeScreen.tsx, WeekDetailScreen.tsx, api.ts są OK).

- [ ] **Krok 2: Build APK**

```bash
cd /c/Dev/mobile/android && JAVA_HOME="C:/Users/rrudnicki/tools/jdk17/jdk17" ANDROID_HOME="C:/Users/rrudnicki/tools/android-sdk" ./gradlew assembleRelease 2>&1 | tail -5
```

Oczekiwany wynik: `BUILD SUCCESSFUL`

- [ ] **Krok 3: Manualna weryfikacja**

Sprawdź:
1. AddEntryScreen — kliknięcie pola Data otwiera modal z siatką kalendarza
2. Wybrany dzień podświetlony kolorem primary
3. Strzałki `‹` `›` zmieniają miesiąc
4. "Gotowe" zamyka modal i wyświetla datę w formacie DD.MM.YYYY
5. "Anuluj" zamyka bez zmiany
6. AddVisitScreen — pole Data działa tak samo
7. AddVisitScreen — kliknięcie pola Godzina otwiera modal z bębnami
8. Scrollowanie bębna zmienia wybraną wartość
9. Wybrany element podświetlony primary, większy
10. "Gotowe" zamyka i wyświetla HH:MM
