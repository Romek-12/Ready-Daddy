# Add Visit + Calendar Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać ekran "Nowa wizyta" dostępny z głównego ekranu, który zapisuje wpis w dzienniku i wydarzenie w systemowym kalendarzu telefonu.

**Architecture:** Nowy `AddVisitScreen` z formularzem wizyty. Nowy `CalendarService` wrappujący `expo-calendar`. HomeScreen dostaje przycisk `calendar-add` w headerze i przeniesiony przycisk ustawień na dół.

**Tech Stack:** React Native 0.81, Expo 54, TypeScript, expo-calendar (już w package.json), useJournal hook, useCurrentWeek hook.

---

## File Map

| Plik | Akcja | Odpowiedzialność |
|------|-------|-----------------|
| `mobile/src/services/calendar/CalendarService.ts` | Create | Logika expo-calendar: uprawnienia, kalendarz, dodawanie eventu |
| `mobile/src/screens/AddVisitScreen.tsx` | Create | Formularz wizyty — UI, state, zapis |
| `mobile/src/types/navigation.ts` | Modify | Dodanie `AddVisit` do `HomeStackParamList` |
| `mobile/src/navigation/AppNavigator.tsx` | Modify | Import i rejestracja `AddVisitScreen` w `HomeStack` |
| `mobile/src/components/Icon.tsx` | Modify | Dodanie `calendar-add` do `ICON_MAP` |
| `mobile/src/screens/HomeScreen.tsx` | Modify | Przycisk calendar-add w headerze, settings footer na dole |

---

## Task 1: CalendarService

**Files:**
- Create: `mobile/src/services/calendar/CalendarService.ts`

- [ ] **Krok 1: Stwórz plik CalendarService.ts**

```typescript
// mobile/src/services/calendar/CalendarService.ts
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

const CALENDAR_NAME = 'Ready Daddy';

interface AddEventParams {
  title: string;
  date: string;          // YYYY-MM-DD
  time?: string;         // HH:MM — brak → allDay
  durationMinutes: number;
  location?: string;
  doctor?: string;
  notes?: string;
}

async function getOrCreateCalendarId(): Promise<string> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existing = calendars.find(c => c.title === CALENDAR_NAME);
  if (existing) return existing.id;

  const defaultCalendarSource =
    Platform.OS === 'ios'
      ? await getIosDefaultSource()
      : { isLocalAccount: true, name: CALENDAR_NAME, type: Calendar.SourceType.LOCAL };

  return Calendar.createCalendarAsync({
    title: CALENDAR_NAME,
    color: '#00E5CC',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: (defaultCalendarSource as Calendar.Source).id,
    source: defaultCalendarSource as Calendar.Source,
    name: 'readydaddy',
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

async function getIosDefaultSource(): Promise<Calendar.Source> {
  const sources = await Calendar.getSourcesAsync();
  return sources.find(s => s.type === Calendar.SourceType.LOCAL) ?? sources[0];
}

export async function addCalendarEvent(params: AddEventParams): Promise<string | null> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') return null;

  const calendarId = await getOrCreateCalendarId();

  const [year, month, day] = params.date.split('-').map(Number);
  let startDate: Date;
  let allDay = false;

  if (params.time) {
    const [hour, minute] = params.time.split(':').map(Number);
    startDate = new Date(year, month - 1, day, hour, minute);
  } else {
    startDate = new Date(year, month - 1, day, 9, 0);
    allDay = true;
  }

  const endDate = new Date(startDate.getTime() + params.durationMinutes * 60 * 1000);

  const notesParts: string[] = [];
  if (params.doctor) notesParts.push(`Lekarz: ${params.doctor}`);
  if (params.notes) notesParts.push(params.notes);
  const notesString = notesParts.join('\n') || undefined;

  const eventId = await Calendar.createEventAsync(calendarId, {
    title: params.title,
    startDate,
    endDate,
    allDay,
    location: params.location,
    notes: notesString,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  return eventId;
}
```

- [ ] **Krok 2: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit 2>&1 | head -20
```

Oczekiwany wynik: brak błędów dla nowego pliku (mogą być istniejące niezwiązane błędy).

- [ ] **Krok 3: Commit**

```bash
git add mobile/src/services/calendar/CalendarService.ts
git commit -m "feat: add CalendarService for expo-calendar integration"
```

---

## Task 2: Ikona i nawigacja

**Files:**
- Modify: `mobile/src/components/Icon.tsx:96` — dodanie `calendar-add`
- Modify: `mobile/src/types/navigation.ts:26` — dodanie `AddVisit`
- Modify: `mobile/src/navigation/AppNavigator.tsx` — import i rejestracja ekranu

- [ ] **Krok 1: Dodaj ikonę `calendar-add` do Icon.tsx**

W pliku `mobile/src/components/Icon.tsx`, w sekcji `// Misc` (przed `'wave'`), dodaj:

```typescript
  'calendar-add': { set: 'mi', name: 'edit-calendar' },
```

- [ ] **Krok 2: Dodaj `AddVisit` do HomeStackParamList w navigation.ts**

W pliku `mobile/src/types/navigation.ts`, w `HomeStackParamList`, dodaj po `Badges: undefined;`:

```typescript
  AddVisit: undefined;
```

- [ ] **Krok 3: Zarejestruj AddVisitScreen w AppNavigator**

W pliku `mobile/src/navigation/AppNavigator.tsx`:

Po istniejących importach ekranów (np. po `import MonthScreen`) dodaj:
```typescript
import AddVisitScreen from '../screens/AddVisitScreen';
```

W funkcji `HomeStackNavigator`, po ostatnim `<HomeStack.Screen name="Month" .../>` dodaj:
```tsx
<HomeStack.Screen name="AddVisit" component={AddVisitScreen} options={{ headerShown: false }} />
```

- [ ] **Krok 4: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit 2>&1 | head -20
```

Oczekiwany wynik: błąd o brakującym module `AddVisitScreen` (plik jeszcze nie istnieje) — to normalne na tym etapie.

- [ ] **Krok 5: Commit**

```bash
git add mobile/src/components/Icon.tsx mobile/src/types/navigation.ts mobile/src/navigation/AppNavigator.tsx
git commit -m "feat: register AddVisit route and calendar-add icon"
```

---

## Task 3: AddVisitScreen

**Files:**
- Create: `mobile/src/screens/AddVisitScreen.tsx`

- [ ] **Krok 1: Stwórz AddVisitScreen.tsx**

```typescript
// mobile/src/screens/AddVisitScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useJournal } from '../hooks/useJournal';
import { useCurrentWeek } from '../hooks/useAppData';
import { addCalendarEvent } from '../services/calendar/CalendarService';
import Icon from '../components/Icon';
import type { Theme } from '../theme';
import type { AppNavigation } from '../types/navigation';
import { logError } from '../utils/logError';

const DURATION_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
];

export default function AddVisitScreen({ navigation }: { navigation: AppNavigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);
  const { user } = useAuth();
  const { add } = useJournal();
  const { data } = useCurrentWeek(user?.conceptionDate);

  const defaultWeek = data?.currentWeek ? String(data.currentWeek + 1) : '';

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [week, setWeek] = useState(defaultWeek);
  const [doctor, setDoctor] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (data?.currentWeek && !week) {
      setWeek(String(data.currentWeek + 1));
    }
  }, [data?.currentWeek]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Brak tytułu', 'Podaj tytuł wizyty.');
      return;
    }

    setSaving(true);
    try {
      const eventId = await addCalendarEvent({
        title: title.trim(),
        date,
        time: time.trim() || undefined,
        durationMinutes: duration,
        location: location.trim() || undefined,
        doctor: doctor.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (eventId === null) {
        Alert.alert(
          'Brak dostępu do kalendarza',
          'Wizyta zostanie zapisana tylko w dzienniku.',
          [{ text: 'OK' }],
        );
      }

      const weekNum = week.trim() ? parseInt(week, 10) : undefined;
      await add({
        type: 'visit',
        title: title.trim(),
        date,
        week: weekNum,
        doctor: doctor.trim() || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      navigation.goBack();
    } catch (err: unknown) {
      logError('AddVisitScreen.handleSave', err);
      Alert.alert('Błąd', 'Nie udało się zapisać wizyty.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nowa wizyta</Text>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.background} />
          ) : (
            <Text style={s.saveBtnLabel}>Zapisz</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.label}>Tytuł *</Text>
        <TextInput
          style={s.input}
          value={title}
          onChangeText={setTitle}
          placeholder="np. Wizyta u ginekologa, USG morfologiczne..."
          placeholderTextColor={theme.colors.textMuted}
          maxLength={100}
        />

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

        <Text style={s.label}>Czas trwania</Text>
        <View style={s.chipRow}>
          {DURATION_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[s.chip, duration === opt.value && s.chipActive]}
              onPress={() => setDuration(opt.value)}
              activeOpacity={0.75}
            >
              <Text style={[s.chipLabel, duration === opt.value && s.chipLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Tydzień ciąży (opcjonalnie)</Text>
        <TextInput
          style={s.input}
          value={week}
          onChangeText={setWeek}
          placeholder="np. 20"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="number-pad"
          maxLength={2}
        />

        <Text style={s.label}>Lekarz (opcjonalnie)</Text>
        <TextInput
          style={s.input}
          value={doctor}
          onChangeText={setDoctor}
          placeholder="np. dr Anna Kowalska"
          placeholderTextColor={theme.colors.textMuted}
          maxLength={80}
        />

        <Text style={s.label}>Placówka (opcjonalnie)</Text>
        <TextInput
          style={s.input}
          value={location}
          onChangeText={setLocation}
          placeholder="np. Centrum Medyczne Medicover"
          placeholderTextColor={theme.colors.textMuted}
          maxLength={100}
        />

        <Text style={s.label}>Notatki (opcjonalnie)</Text>
        <TextInput
          style={[s.input, s.inputMultiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Pytania do lekarza, wyniki, obserwacje..."
          placeholderTextColor={theme.colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={1000}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme, topInset: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: topInset + 8,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    backBtn: { padding: 8 },
    headerTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
    },
    saveBtn: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.full,
      minWidth: 72,
      alignItems: 'center',
    },
    saveBtnLabel: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.background,
    },
    scroll: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: 48,
      gap: 6,
    },
    label: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.textSecondary,
      marginTop: 12,
      marginBottom: 4,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 12,
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
    },
    inputMultiline: {
      minHeight: 100,
      paddingTop: 12,
    },
    row: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    rowHalf: { flex: 1 },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    chipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipLabel: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.textSecondary,
    },
    chipLabelActive: { color: theme.colors.background },
  });
```

- [ ] **Krok 2: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit 2>&1 | head -30
```

Oczekiwany wynik: brak nowych błędów TypeScript.

- [ ] **Krok 3: Commit**

```bash
git add mobile/src/screens/AddVisitScreen.tsx
git commit -m "feat: add AddVisitScreen with calendar and journal save"
```

---

## Task 4: Zmiany HomeScreen

**Files:**
- Modify: `mobile/src/screens/HomeScreen.tsx`

- [ ] **Krok 1: Zamień przycisk settings na calendar-add w headerze**

W pliku `mobile/src/screens/HomeScreen.tsx`, znajdź linię (około 113):
```tsx
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={s.settingsBtn} accessibilityRole="button" accessibilityLabel="Ustawienia">
          <Icon name="gear" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
```

Zastąp:
```tsx
        <TouchableOpacity onPress={() => navigation.navigate('AddVisit')} style={s.settingsBtn} accessibilityRole="button" accessibilityLabel="Dodaj wizytę">
          <Icon name="calendar-add" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
```

- [ ] **Krok 2: Dodaj przycisk Settings na dole ekranu**

Znajdź na końcu JSX (przed `</ScrollView>`):
```tsx
      <View style={{ height: 20 }} />
    </ScrollView>
```

Zastąp:
```tsx
      <TouchableOpacity
        onPress={() => navigation.navigate('Settings')}
        style={s.settingsFooter}
        accessibilityRole="button"
        accessibilityLabel="Ustawienia"
      >
        <Icon name="gear" size={16} color={theme.colors.textMuted} />
        <Text style={s.settingsFooterLabel}>Ustawienia</Text>
      </TouchableOpacity>
      <View style={{ height: 20 }} />
    </ScrollView>
```

- [ ] **Krok 3: Dodaj style settingsFooter i settingsFooterLabel**

W funkcji `createStyles`, po `moduleLabel`:
```typescript
  settingsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing.lg,
  },
  settingsFooterLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
```

- [ ] **Krok 4: Sprawdź TypeScript**

```bash
cd mobile && npx tsc --noEmit 2>&1 | head -20
```

Oczekiwany wynik: brak błędów.

- [ ] **Krok 5: Commit**

```bash
git add mobile/src/screens/HomeScreen.tsx
git commit -m "feat: move settings to footer, add calendar-add button in header"
```

---

## Task 5: Weryfikacja końcowa

- [ ] **Krok 1: Pełny TypeScript check**

```bash
cd mobile && npx tsc --noEmit 2>&1
```

Oczekiwany wynik: brak nowych błędów TypeScript.

- [ ] **Krok 2: Zbuduj APK**

```bash
cd mobile/android && JAVA_HOME="C:/Users/rrudnicki/tools/jdk17/jdk17" ANDROID_HOME="C:/Users/rrudnicki/tools/android-sdk" ./gradlew assembleRelease 2>&1 | tail -5
```

Oczekiwany wynik: `BUILD SUCCESSFUL`

- [ ] **Krok 3: Manualna weryfikacja na urządzeniu**

Sprawdź:
1. Przycisk `calendar-add` widoczny w headerze głównego ekranu
2. Kliknięcie otwiera formularz "Nowa wizyta"
3. Tydzień ciąży wypełniony domyślnie `currentWeek + 1`
4. Czas trwania domyślnie "30 min"
5. Zapisanie bez godziny → event `allDay` w kalendarzu
6. Zapisanie z godziną → event z czasem w kalendarzu
7. Wpis pojawia się w dzienniku (typ "Wizyta")
8. Przycisk Settings widoczny na dole ekranu głównego, działa poprawnie
9. Odmowa uprawnień → Alert, wpis zapisuje się tylko w dzienniku
