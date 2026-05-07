# Checkup Calendar Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Po odhaczeniu badania w `CheckupsScreen` użytkownik decyduje, czy dodać wydarzenie do kalendarza (z 3 przypomnieniami) i wpis do dziennika; po odznaczeniu pyta się, czy usunąć wydarzenie z kalendarza.

**Architecture:** Rozszerzamy istniejący `usePersistedChecklist` o metadane (`calendarEventId`, `journalEntryId`). Dodajemy `createExamEvent`/`deleteExamEvent` do istniejącego `CalendarService`. Tworzymy nowy `AddExamSheet` — modal z formularzem. Przepisujemy logikę checkboxa w `CheckupsScreen` na state machine z dialogami. Usuwamy osobny przycisk ikony kalendarza obok każdego badania.

**Tech Stack:** React Native 0.81 + Expo 54, TypeScript 5.8 (strict), AsyncStorage, expo-calendar, `@react-native-community/datetimepicker` (już w deps), Jest + `@testing-library/react-native`.

**Spec:** `docs/superpowers/specs/2026-05-07-checkup-calendar-flow-design.md`

---

## File Structure

**Nowe:**
- `mobile/src/components/checkups/AddExamSheet.tsx` — modal z formularzem (data/godzina/czas trwania/lekarz/miejsce/notatka).
- `mobile/src/components/checkups/__tests__/AddExamSheet.test.tsx`
- `mobile/src/services/calendar/__tests__/CalendarService.exam.test.ts`
- `mobile/src/hooks/__tests__/usePersistedChecklist.test.ts`
- `mobile/src/screens/__tests__/CheckupsScreen.flow.test.tsx`

**Zmienione:**
- `mobile/src/hooks/usePersistedChecklist.ts` — rozszerzenie state z `boolean` na `{ checked: boolean; calendarEventId?: string; journalEntryId?: string }` z migracją.
- `mobile/src/services/calendar/CalendarService.ts` — `createExamEvent` (z 3 alarmami), `deleteExamEvent`.
- `mobile/src/screens/CheckupsScreen.tsx` — usuwamy ikonę kalendarza obok badania; nowa logika checkboxa.

---

## Task 1: Rozszerzenie `usePersistedChecklist` o metadane

**Files:**
- Modify: `mobile/src/hooks/usePersistedChecklist.ts`
- Create: `mobile/src/hooks/__tests__/usePersistedChecklist.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `mobile/src/hooks/__tests__/usePersistedChecklist.test.ts`:

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePersistedChecklist } from '../usePersistedChecklist';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(() => AsyncStorage.clear());

describe('usePersistedChecklist', () => {
  it('migrates legacy boolean state to object form', async () => {
    await AsyncStorage.setItem('checklist_test', JSON.stringify({ a: true, b: false }));
    const { result } = renderHook(() => usePersistedChecklist('test'));
    await waitFor(() => expect(result.current.checked.a).toBe(true));
    expect(result.current.checked.a).toBe(true);
    expect(result.current.checked.b).toBe(false);
    expect(result.current.getMeta('a')).toEqual({});
  });

  it('toggleCheck flips state and clears meta on uncheck', async () => {
    const { result } = renderHook(() => usePersistedChecklist('test'));
    await act(async () => { result.current.setCheckedWithMeta('x', true, { calendarEventId: 'evt-1', journalEntryId: 'j-1' }); });
    expect(result.current.checked.x).toBe(true);
    expect(result.current.getMeta('x')).toEqual({ calendarEventId: 'evt-1', journalEntryId: 'j-1' });
    await act(async () => { result.current.toggleCheck('x'); });
    expect(result.current.checked.x).toBe(false);
    expect(result.current.getMeta('x')).toEqual({});
  });

  it('persists meta across reload', async () => {
    const { result, unmount } = renderHook(() => usePersistedChecklist('test'));
    await act(async () => { result.current.setCheckedWithMeta('y', true, { calendarEventId: 'evt-2' }); });
    unmount();
    const { result: result2 } = renderHook(() => usePersistedChecklist('test'));
    await waitFor(() => expect(result2.current.checked.y).toBe(true));
    expect(result2.current.getMeta('y')).toEqual({ calendarEventId: 'evt-2' });
  });

  it('returns undefined meta for unknown key', () => {
    const { result } = renderHook(() => usePersistedChecklist('test'));
    expect(result.current.getMeta('nonexistent')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd mobile && npx jest src/hooks/__tests__/usePersistedChecklist.test.ts`
Expected: FAIL — `setCheckedWithMeta` and `getMeta` not exported.

- [ ] **Step 3: Implement the new hook API**

Replace contents of `mobile/src/hooks/usePersistedChecklist.ts`:

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '../utils/logError';

export interface ChecklistItemMeta {
  calendarEventId?: string;
  journalEntryId?: string;
}

interface ChecklistEntry {
  checked: boolean;
  meta?: ChecklistItemMeta;
}

type StoredState = Record<string, ChecklistEntry>;
type LegacyState = Record<string, boolean>;

function migrate(raw: unknown): StoredState {
  if (!raw || typeof raw !== 'object') return {};
  const out: StoredState = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'boolean') {
      out[key] = { checked: value };
    } else if (value && typeof value === 'object' && 'checked' in value) {
      const v = value as ChecklistEntry;
      out[key] = { checked: !!v.checked, meta: v.meta };
    }
  }
  return out;
}

/**
 * A hook that persists checklist state with optional per-item metadata
 * (calendar event id, journal entry id).
 *
 * Backward-compatible: legacy `Record<string, boolean>` storage is migrated
 * on load.
 */
export function usePersistedChecklist(storageKey: string) {
  const [state, setState] = useState<StoredState>({});
  const stateRef = useRef<StoredState>({});
  stateRef.current = state;

  useEffect(() => {
    AsyncStorage.getItem(`checklist_${storageKey}`)
      .then(raw => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as LegacyState | StoredState;
        setState(migrate(parsed));
      })
      .catch((e) => logError('usePersistedChecklist:load', e));
  }, [storageKey]);

  const persist = useCallback((next: StoredState) => {
    AsyncStorage.setItem(`checklist_${storageKey}`, JSON.stringify(next))
      .catch((e) => logError('usePersistedChecklist:persist', e));
  }, [storageKey]);

  const checked = useCallback(() => {
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(state)) out[k] = v.checked;
    return out;
  }, [state])();

  const toggleCheck = useCallback((key: string) => {
    setState(prev => {
      const wasChecked = prev[key]?.checked ?? false;
      const next: StoredState = { ...prev, [key]: { checked: !wasChecked } };
      persist(next);
      return next;
    });
  }, [persist]);

  const setCheckedWithMeta = useCallback(
    (key: string, isChecked: boolean, meta?: ChecklistItemMeta) => {
      setState(prev => {
        const next: StoredState = {
          ...prev,
          [key]: { checked: isChecked, meta: isChecked ? meta : undefined },
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const getMeta = useCallback((key: string): ChecklistItemMeta | undefined => {
    const entry = stateRef.current[key];
    if (!entry) return undefined;
    return entry.meta ?? {};
  }, []);

  const resetChecklist = useCallback(() => {
    setState({});
    AsyncStorage.removeItem(`checklist_${storageKey}`).catch((e) => logError('usePersistedChecklist:persist', e));
  }, [storageKey]);

  return { checked, toggleCheck, setCheckedWithMeta, getMeta, resetChecklist };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd mobile && npx jest src/hooks/__tests__/usePersistedChecklist.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Run typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 6: Commit**

```bash
cd mobile
git add src/hooks/usePersistedChecklist.ts src/hooks/__tests__/usePersistedChecklist.test.ts
git commit -m "feat(checklist): add per-item metadata with legacy migration"
```

---

## Task 2: `CalendarService.createExamEvent` + `deleteExamEvent`

**Files:**
- Modify: `mobile/src/services/calendar/CalendarService.ts`
- Create: `mobile/src/services/calendar/__tests__/CalendarService.exam.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `mobile/src/services/calendar/__tests__/CalendarService.exam.test.ts`:

```typescript
import * as Calendar from 'expo-calendar';
import { createExamEvent, deleteExamEvent } from '../CalendarService';

jest.mock('expo-calendar');
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'android',
  select: (o: Record<string, unknown>) => o.android ?? o.default,
}));

const mockedCalendar = Calendar as jest.Mocked<typeof Calendar>;

describe('CalendarService exam events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCalendar.requestCalendarPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never',
    } as never);
    mockedCalendar.getCalendarsAsync.mockResolvedValue([
      { id: 'cal-1', title: 'Ready Daddy', allowsModifications: true } as never,
    ]);
    mockedCalendar.createEventAsync.mockResolvedValue('evt-123' as never);
    mockedCalendar.deleteEventAsync.mockResolvedValue(undefined as never);
  });

  it('createExamEvent passes 3 alarms (-2880, -1440, -120)', async () => {
    const start = new Date(2026, 4, 10, 9, 0);
    const end = new Date(2026, 4, 10, 10, 0);
    const id = await createExamEvent({ title: 'USG', start, end, doctor: 'Dr X', location: 'Klinika' });
    expect(id).toBe('evt-123');
    const callArgs = mockedCalendar.createEventAsync.mock.calls[0][1];
    expect(callArgs.alarms).toEqual([
      { relativeOffset: -2880 },
      { relativeOffset: -1440 },
      { relativeOffset: -120 },
    ]);
    expect(callArgs.title).toBe('USG');
    expect(callArgs.startDate).toEqual(start);
    expect(callArgs.endDate).toEqual(end);
    expect(callArgs.location).toBe('Klinika');
    expect(callArgs.notes).toContain('Dr X');
  });

  it('createExamEvent returns null when permissions denied', async () => {
    mockedCalendar.requestCalendarPermissionsAsync.mockResolvedValueOnce({
      status: 'denied', granted: false, canAskAgain: false, expires: 'never',
    } as never);
    const id = await createExamEvent({
      title: 'USG',
      start: new Date(),
      end: new Date(),
    });
    expect(id).toBeNull();
    expect(mockedCalendar.createEventAsync).not.toHaveBeenCalled();
  });

  it('createExamEvent returns null when createEventAsync throws', async () => {
    mockedCalendar.createEventAsync.mockRejectedValueOnce(new Error('boom'));
    const id = await createExamEvent({
      title: 'USG',
      start: new Date(),
      end: new Date(),
    });
    expect(id).toBeNull();
  });

  it('deleteExamEvent swallows "not found" errors', async () => {
    mockedCalendar.deleteEventAsync.mockRejectedValueOnce(new Error('not found'));
    await expect(deleteExamEvent('evt-missing')).resolves.toBeUndefined();
  });

  it('deleteExamEvent calls Calendar.deleteEventAsync with id', async () => {
    await deleteExamEvent('evt-123');
    expect(mockedCalendar.deleteEventAsync).toHaveBeenCalledWith('evt-123');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd mobile && npx jest src/services/calendar/__tests__/CalendarService.exam.test.ts`
Expected: FAIL — `createExamEvent`/`deleteExamEvent` not exported.

- [ ] **Step 3: Add exports to CalendarService**

Append to `mobile/src/services/calendar/CalendarService.ts` (after the existing `addCalendarEvent` export, do **not** remove existing code):

```typescript
interface CreateExamEventParams {
  title: string;
  start: Date;
  end: Date;
  doctor?: string;
  location?: string;
  notes?: string;
}

const EXAM_ALARMS = [
  { relativeOffset: -2880 }, // 2 days before
  { relativeOffset: -1440 }, // 1 day before
  { relativeOffset: -120 },  // 2 hours before
];

export async function createExamEvent(params: CreateExamEventParams): Promise<string | null> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') return null;

  try {
    const calendarId = await getOrCreateCalendarId();

    const notesParts: string[] = [];
    if (params.doctor) notesParts.push(`Lekarz: ${params.doctor}`);
    if (params.notes) notesParts.push(params.notes);
    const notesString = notesParts.join('\n') || undefined;

    return await Calendar.createEventAsync(calendarId, {
      title: params.title,
      startDate: params.start,
      endDate: params.end,
      location: params.location,
      notes: notesString,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      alarms: EXAM_ALARMS,
    });
  } catch (err: unknown) {
    logError('CalendarService.createExamEvent', err instanceof Error ? err : new Error(String(err)));
    return null;
  }
}

export async function deleteExamEvent(eventId: string): Promise<void> {
  try {
    await Calendar.deleteEventAsync(eventId);
  } catch (err: unknown) {
    logError('CalendarService.deleteExamEvent', err instanceof Error ? err : new Error(String(err)));
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd mobile && npx jest src/services/calendar/__tests__/CalendarService.exam.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Run typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd mobile
git add src/services/calendar/CalendarService.ts src/services/calendar/__tests__/
git commit -m "feat(calendar): add createExamEvent/deleteExamEvent with 3 alarms"
```

---

## Task 3: `AddExamSheet` modal komponent

**Files:**
- Create: `mobile/src/components/checkups/AddExamSheet.tsx`
- Create: `mobile/src/components/checkups/__tests__/AddExamSheet.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `mobile/src/components/checkups/__tests__/AddExamSheet.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddExamSheet from '../AddExamSheet';
import { ThemeProvider } from '../../../context/ThemeContext';

const wrap = (ui: React.ReactElement) => <ThemeProvider>{ui}</ThemeProvider>;

describe('AddExamSheet', () => {
  it('shows exam name and week as read-only', () => {
    const { getByText } = render(
      wrap(<AddExamSheet visible examName="USG genetyczne" week={12} onCancel={jest.fn()} onSubmit={jest.fn()} />),
    );
    expect(getByText('USG genetyczne')).toBeTruthy();
    expect(getByText(/Tydzień: 12/)).toBeTruthy();
  });

  it('calls onCancel when Anuluj pressed', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      wrap(<AddExamSheet visible examName="USG" week={12} onCancel={onCancel} onSubmit={jest.fn()} />),
    );
    fireEvent.press(getByText('Anuluj'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onSubmit with default values (tomorrow 09:00, 60min) and empty optional fields', async () => {
    const onSubmit = jest.fn();
    const { getByText } = render(
      wrap(<AddExamSheet visible examName="USG" week={12} onCancel={jest.fn()} onSubmit={onSubmit} />),
    );
    fireEvent.press(getByText('Zapisz'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.start).toBeInstanceOf(Date);
    expect(payload.end).toBeInstanceOf(Date);
    expect(payload.end.getTime() - payload.start.getTime()).toBe(60 * 60 * 1000);
    expect(payload.start.getHours()).toBe(9);
    expect(payload.start.getMinutes()).toBe(0);
    expect(payload.doctor).toBeUndefined();
    expect(payload.location).toBeUndefined();
    expect(payload.notes).toBeUndefined();
  });

  it('passes optional fields when filled', async () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      wrap(<AddExamSheet visible examName="USG" week={12} onCancel={jest.fn()} onSubmit={onSubmit} />),
    );
    fireEvent.changeText(getByPlaceholderText('Lekarz (opcjonalne)'), 'Dr Kowalska');
    fireEvent.changeText(getByPlaceholderText('Miejsce (opcjonalne)'), 'Klinika A');
    fireEvent.changeText(getByPlaceholderText('Notatka (opcjonalne)'), 'Na czczo');
    fireEvent.press(getByText('Zapisz'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.doctor).toBe('Dr Kowalska');
    expect(payload.location).toBe('Klinika A');
    expect(payload.notes).toBe('Na czczo');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd mobile && npx jest src/components/checkups/__tests__/AddExamSheet.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement AddExamSheet**

Create `mobile/src/components/checkups/AddExamSheet.tsx`:

```typescript
import React, { useState, useMemo } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import GlassCard from '../ui/GlassCard';
import AuroraBackground from '../ui/AuroraBackground';
import Icon from '../Icon';
import type { Theme } from '../../theme';

export interface ExamSubmitPayload {
  start: Date;
  end: Date;
  doctor?: string;
  location?: string;
  notes?: string;
}

interface Props {
  visible: boolean;
  examName: string;
  week: number;
  onCancel: () => void;
  onSubmit: (payload: ExamSubmitPayload) => void;
}

const DURATION_OPTIONS = [
  { label: '30 min', minutes: 30 },
  { label: '1 godz.', minutes: 60 },
  { label: '1.5 godz.', minutes: 90 },
  { label: '2 godz.', minutes: 120 },
];

function tomorrowAt9(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

export default function AddExamSheet({ visible, examName, week, onCancel, onSubmit }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);

  const [date, setDate] = useState<Date>(tomorrowAt9);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [doctor, setDoctor] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSubmit = () => {
    const start = date;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    onSubmit({
      start,
      end,
      doctor: doctor.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const dateLabel = date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeLabel = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} onRequestClose={onCancel}>
      <AuroraBackground>
        <View style={s.container}>
          <View style={s.header}>
            <TouchableOpacity onPress={onCancel} accessibilityRole="button">
              <Text style={s.headerBtn}>Anuluj</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Dodaj badanie</Text>
            <TouchableOpacity onPress={handleSubmit} accessibilityRole="button">
              <Text style={[s.headerBtn, s.headerBtnPrimary]}>Zapisz</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.scrollContent}>
            <GlassCard style={s.section}>
              <Text style={s.examName}>{examName}</Text>
              <Text style={s.weekLabel}>Tydzień: {week}</Text>
            </GlassCard>

            <GlassCard style={s.section}>
              <TouchableOpacity style={s.row} onPress={() => setShowDatePicker(true)} accessibilityRole="button" accessibilityLabel="Wybierz datę">
                <Icon name="calendar" size={18} color={theme.colors.primary} />
                <Text style={s.rowLabel}>Data</Text>
                <Text style={s.rowValue}>{dateLabel}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.row} onPress={() => setShowTimePicker(true)} accessibilityRole="button" accessibilityLabel="Wybierz godzinę">
                <Icon name="schedule" size={18} color={theme.colors.primary} />
                <Text style={s.rowLabel}>Godzina</Text>
                <Text style={s.rowValue}>{timeLabel}</Text>
              </TouchableOpacity>

              <View style={s.durationRow}>
                <Text style={s.rowLabel}>Czas trwania</Text>
                <View style={s.durationOptions}>
                  {DURATION_OPTIONS.map(opt => {
                    const active = durationMinutes === opt.minutes;
                    return (
                      <TouchableOpacity
                        key={opt.minutes}
                        onPress={() => setDurationMinutes(opt.minutes)}
                        style={[s.durBtn, active && s.durBtnActive]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[s.durBtnText, active && s.durBtnTextActive]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </GlassCard>

            <GlassCard style={s.section}>
              <TextInput
                style={s.input}
                placeholder="Lekarz (opcjonalne)"
                placeholderTextColor={theme.colors.textMuted}
                value={doctor}
                onChangeText={setDoctor}
              />
              <TextInput
                style={s.input}
                placeholder="Miejsce (opcjonalne)"
                placeholderTextColor={theme.colors.textMuted}
                value={location}
                onChangeText={setLocation}
              />
              <TextInput
                style={[s.input, s.inputMulti]}
                placeholder="Notatka (opcjonalne)"
                placeholderTextColor={theme.colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </GlassCard>

            <Text style={s.reminderInfo}>ℹ Przypomnienia: 2 dni, 1 dzień, 2 godziny przed</Text>
          </ScrollView>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              onChange={(event, selected) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selected) {
                  const next = new Date(date);
                  next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                  setDate(next);
                }
              }}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              onChange={(event, selected) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (selected) {
                  const next = new Date(date);
                  next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                  setDate(next);
                }
              }}
            />
          )}
        </View>
      </AuroraBackground>
    </Modal>
  );
}

const createStyles = (theme: Theme, topInset: number) => StyleSheet.create({
  container: { flex: 1, paddingTop: topInset },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerBtn: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary },
  headerBtnPrimary: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold },
  headerTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  scrollContent: { padding: theme.spacing.lg, gap: theme.spacing.md },
  section: { padding: theme.spacing.md, gap: theme.spacing.sm },
  examName: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  weekLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  rowLabel: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.text },
  rowValue: { fontSize: theme.fontSize.md, color: theme.colors.primary, fontWeight: theme.fontWeight.semibold },
  durationRow: { paddingVertical: theme.spacing.sm, gap: theme.spacing.sm },
  durationOptions: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  durBtn: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  durBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  durBtnText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  durBtnTextActive: { color: theme.colors.background, fontWeight: theme.fontWeight.semibold },
  input: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    paddingVertical: theme.spacing.sm,
  },
  inputMulti: { minHeight: 60, textAlignVertical: 'top' },
  reminderInfo: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing.sm },
});
```

- [ ] **Step 4: Mock DateTimePicker in jest setup if needed**

Verify `mobile/jest.config.js` or `jest-setup.ts` mocks `@react-native-community/datetimepicker`. If not, add to a setup file:

```typescript
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
```

If `mobile/jest-setup.ts` does not exist, check `mobile/package.json` for the `jest` config and add the mock to whatever setup file is referenced. If none, create `mobile/jest-setup.ts` and reference it from `package.json` `jest.setupFiles`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd mobile && npx jest src/components/checkups/__tests__/AddExamSheet.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Run typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd mobile
git add src/components/checkups/
git commit -m "feat(checkups): add AddExamSheet modal with form"
```

---

## Task 4: Integracja `CheckupsScreen` — flow checkbox + dialogi

**Files:**
- Modify: `mobile/src/screens/CheckupsScreen.tsx`
- Create: `mobile/src/screens/__tests__/CheckupsScreen.flow.test.tsx`

- [ ] **Step 1: Write the failing integration tests**

Create `mobile/src/screens/__tests__/CheckupsScreen.flow.test.tsx`:

```typescript
import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CheckupsScreen from '../CheckupsScreen';
import { ThemeProvider } from '../../context/ThemeContext';
import * as CalendarService from '../../services/calendar/CalendarService';
import * as JournalService from '../../services/journal/JournalService';
import * as useAppData from '../../hooks/useAppData';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../../services/calendar/CalendarService');
jest.mock('../../services/journal/JournalService');

const mockedCalendar = CalendarService as jest.Mocked<typeof CalendarService>;
const mockedJournal = JournalService as jest.Mocked<typeof JournalService>;

const FAKE_VISITS = {
  visits: [{
    id: 1, weekRange: '12 tc', title: 'Wizyta 1', subtitle: '', colorKey: 'primary',
    categories: [{
      id: 1, title: 'Badania', icon: 'lab', colorKey: 'primary',
      items: [{ id: 1, name: 'USG genetyczne' }],
    }],
  }],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(useAppData, 'useCheckupVisits').mockReturnValue({ data: FAKE_VISITS } as never);
  mockedCalendar.createExamEvent.mockResolvedValue('evt-1');
  mockedCalendar.deleteExamEvent.mockResolvedValue(undefined);
  mockedJournal.addEntry.mockResolvedValue({ id: 'j-1' } as never);
});

const wrap = (ui: React.ReactElement) => <ThemeProvider>{ui}</ThemeProvider>;

describe('CheckupsScreen flow', () => {
  it('clicking unchecked item shows "add to calendar?" dialog', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText, getByLabelText } = render(wrap(<CheckupsScreen />));
    fireEvent.press(getByText('Wizyta 1'));
    await waitFor(() => getByLabelText('USG genetyczne'));
    fireEvent.press(getByLabelText('USG genetyczne'));
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringMatching(/kalendarz/i),
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Tak' }),
        expect.objectContaining({ text: 'Nie' }),
      ]),
    );
  });

  it('"Nie" → checks item without opening sheet or creating entries', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText, getByLabelText } = render(wrap(<CheckupsScreen />));
    fireEvent.press(getByText('Wizyta 1'));
    await waitFor(() => getByLabelText('USG genetyczne'));
    fireEvent.press(getByLabelText('USG genetyczne'));
    const buttons = alertSpy.mock.calls[0][2] as Array<{ text: string; onPress?: () => void }>;
    const nieBtn = buttons.find(b => b.text === 'Nie');
    nieBtn?.onPress?.();
    await waitFor(() => {
      expect(getByLabelText('USG genetyczne').props.accessibilityState.checked).toBe(true);
    });
    expect(mockedCalendar.createExamEvent).not.toHaveBeenCalled();
    expect(mockedJournal.addEntry).not.toHaveBeenCalled();
  });

  it('"Tak" → opens AddExamSheet; "Zapisz" creates event + journal entry', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText, getByLabelText } = render(wrap(<CheckupsScreen />));
    fireEvent.press(getByText('Wizyta 1'));
    await waitFor(() => getByLabelText('USG genetyczne'));
    fireEvent.press(getByLabelText('USG genetyczne'));
    const buttons = alertSpy.mock.calls[0][2] as Array<{ text: string; onPress?: () => void }>;
    buttons.find(b => b.text === 'Tak')?.onPress?.();
    await waitFor(() => getByText('Dodaj badanie'));
    fireEvent.press(getByText('Zapisz'));
    await waitFor(() => expect(mockedCalendar.createExamEvent).toHaveBeenCalled());
    expect(mockedJournal.addEntry).toHaveBeenCalledWith(expect.objectContaining({
      type: 'exam',
      title: 'USG genetyczne',
      linkedExamId: expect.stringContaining('checkup-v0'),
    }));
  });

  it('clicking checked item with calendar meta shows "remove from calendar?" dialog', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText, getByLabelText } = render(wrap(<CheckupsScreen />));
    fireEvent.press(getByText('Wizyta 1'));
    await waitFor(() => getByLabelText('USG genetyczne'));
    // First check + save → meta is set
    fireEvent.press(getByLabelText('USG genetyczne'));
    const addButtons = alertSpy.mock.calls[0][2] as Array<{ text: string; onPress?: () => void }>;
    addButtons.find(b => b.text === 'Tak')?.onPress?.();
    await waitFor(() => getByText('Dodaj badanie'));
    fireEvent.press(getByText('Zapisz'));
    await waitFor(() => expect(mockedCalendar.createExamEvent).toHaveBeenCalled());

    alertSpy.mockClear();
    // Now click again (checked) — should ask about calendar removal
    fireEvent.press(getByLabelText('USG genetyczne'));
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringMatching(/usun|usunąć/i),
      expect.any(String),
      expect.any(Array),
    );
    const removeButtons = alertSpy.mock.calls[0][2] as Array<{ text: string; onPress?: () => void }>;
    removeButtons.find(b => b.text === 'Tak')?.onPress?.();
    await waitFor(() => expect(mockedCalendar.deleteExamEvent).toHaveBeenCalledWith('evt-1'));
  });

  it('clicking checked item without calendar meta unchecks immediately, no dialog', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText, getByLabelText } = render(wrap(<CheckupsScreen />));
    fireEvent.press(getByText('Wizyta 1'));
    await waitFor(() => getByLabelText('USG genetyczne'));
    // Check via "Nie" path — no calendar meta
    fireEvent.press(getByLabelText('USG genetyczne'));
    const buttons = alertSpy.mock.calls[0][2] as Array<{ text: string; onPress?: () => void }>;
    buttons.find(b => b.text === 'Nie')?.onPress?.();
    await waitFor(() => {
      expect(getByLabelText('USG genetyczne').props.accessibilityState.checked).toBe(true);
    });

    alertSpy.mockClear();
    fireEvent.press(getByLabelText('USG genetyczne'));
    expect(alertSpy).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(getByLabelText('USG genetyczne').props.accessibilityState.checked).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd mobile && npx jest src/screens/__tests__/CheckupsScreen.flow.test.tsx`
Expected: FAIL — current screen does not show dialogs / does not call new services.

- [ ] **Step 3: Refactor `CheckupsScreen`**

Replace `mobile/src/screens/CheckupsScreen.tsx` with:

```typescript
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { usePersistedChecklist } from '../hooks/usePersistedChecklist';
import { useCheckupVisits } from '../hooks/useAppData';
import { createExamEvent, deleteExamEvent } from '../services/calendar/CalendarService';
import { addEntry as addJournalEntry } from '../services/journal/JournalService';
import { logError } from '../utils/logError';
import type { Theme } from '../theme';
import Icon from '../components/Icon';
import GlassCard from '../components/ui/GlassCard';
import AuroraBackground from '../components/ui/AuroraBackground';
import AddExamSheet, { ExamSubmitPayload } from '../components/checkups/AddExamSheet';

interface CheckItem {
  id: number;
  name: string;
  optional?: boolean;
  note?: string | null;
}

interface CheckCategory {
  id: number;
  title: string;
  icon: string;
  colorKey: string;
  singleCheck?: boolean;
  items: CheckItem[];
}

interface VisitPeriod {
  id: number;
  weekRange: string;
  title: string;
  subtitle: string;
  colorKey: string;
  categories: CheckCategory[];
}

const resolveColor = (colorKey: string, theme: Theme): string => {
  const c = theme.colors as Record<string, string>;
  return c[colorKey] || theme.colors.primary;
};

const getItemKey = (vIdx: number, cIdx: number, iIdx: number) => `checkup-v${vIdx}-c${cIdx}-i${iIdx}`;
const getCatKey = (vIdx: number, cIdx: number) => `checkup-v${vIdx}-cat${cIdx}`;

const countCheckable = (visit: VisitPeriod) =>
  visit.categories.reduce((sum, cat) => sum + (cat.singleCheck ? 1 : cat.items.length), 0);

const countCheckedInVisit = (visit: VisitPeriod, vIdx: number, checked: Record<string, boolean>) =>
  visit.categories.reduce((sum, cat, cIdx) => {
    if (cat.singleCheck) return sum + (checked[getCatKey(vIdx, cIdx)] ? 1 : 0);
    return sum + cat.items.filter((_, iIdx) => checked[getItemKey(vIdx, cIdx, iIdx)]).length;
  }, 0);

interface PendingExam {
  key: string;
  examName: string;
  weekRange: string;
}

function parseFirstWeek(weekRange: string): number {
  const match = weekRange.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

export default function CheckupsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const s = React.useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);
  const { data } = useCheckupVisits();
  const visits: VisitPeriod[] = data?.visits ?? [];
  const [expanded, setExpanded] = useState<number | null>(null);
  const { checked, toggleCheck, setCheckedWithMeta, getMeta } = usePersistedChecklist('checkups');
  const [pendingExam, setPendingExam] = useState<PendingExam | null>(null);

  const toggle = (idx: number) => setExpanded(expanded === idx ? null : idx);

  const handleAddConfirmed = useCallback((key: string, examName: string, weekRange: string) => {
    // Step 1: mark checked immediately (per option C)
    setCheckedWithMeta(key, true);
    // Step 2: open sheet
    setPendingExam({ key, examName, weekRange });
  }, [setCheckedWithMeta]);

  const handleSheetCancel = useCallback(() => {
    setPendingExam(null);
  }, []);

  const handleSheetSubmit = useCallback(async (payload: ExamSubmitPayload) => {
    if (!pendingExam) return;
    const { key, examName, weekRange } = pendingExam;
    setPendingExam(null);

    let calendarEventId: string | undefined;
    let journalEntryId: string | undefined;

    try {
      const eventId = await createExamEvent({
        title: `Badanie: ${examName}`,
        start: payload.start,
        end: payload.end,
        doctor: payload.doctor,
        location: payload.location,
        notes: payload.notes,
      });
      calendarEventId = eventId ?? undefined;
    } catch (err: unknown) {
      logError('CheckupsScreen.createExamEvent', err);
    }

    if (calendarEventId === undefined) {
      Alert.alert(
        'Brak wydarzenia w kalendarzu',
        'Nie udało się dodać wydarzenia. Wpis trafi tylko do dziennika.',
      );
    }

    try {
      const isoDate = payload.start.toISOString().slice(0, 10);
      const entry = await addJournalEntry({
        type: 'exam',
        title: examName,
        date: isoDate,
        week: parseFirstWeek(weekRange),
        notes: payload.notes,
        doctor: payload.doctor,
        location: payload.location,
        linkedExamId: key,
        reminder: payload.start.toISOString(),
      });
      journalEntryId = entry.id;
    } catch (err: unknown) {
      logError('CheckupsScreen.addJournalEntry', err);
    }

    setCheckedWithMeta(key, true, { calendarEventId, journalEntryId });
  }, [pendingExam, setCheckedWithMeta]);

  const promptUncheck = useCallback((key: string) => {
    const meta = getMeta(key);
    if (!meta?.calendarEventId) {
      toggleCheck(key);
      return;
    }
    Alert.alert(
      'Usunąć z kalendarza?',
      'Czy chcesz usunąć też wydarzenie z kalendarza telefonu?',
      [
        {
          text: 'Nie',
          style: 'cancel',
          onPress: () => toggleCheck(key),
        },
        {
          text: 'Tak',
          onPress: async () => {
            try {
              await deleteExamEvent(meta.calendarEventId!);
            } catch (err: unknown) {
              logError('CheckupsScreen.deleteExamEvent', err);
            }
            toggleCheck(key);
          },
        },
      ],
    );
  }, [getMeta, toggleCheck]);

  const promptCheck = useCallback((key: string, examName: string, weekRange: string) => {
    Alert.alert(
      'Dodać do kalendarza?',
      `Czy chcesz dodać „${examName}" do kalendarza telefonu?`,
      [
        {
          text: 'Nie',
          style: 'cancel',
          onPress: () => setCheckedWithMeta(key, true),
        },
        {
          text: 'Tak',
          onPress: () => handleAddConfirmed(key, examName, weekRange),
        },
      ],
    );
  }, [setCheckedWithMeta, handleAddConfirmed]);

  const onCheckboxPress = useCallback((key: string, examName: string, weekRange: string) => {
    if (checked[key]) {
      promptUncheck(key);
    } else {
      promptCheck(key, examName, weekRange);
    }
  }, [checked, promptUncheck, promptCheck]);

  const totalItems = useMemo(() => visits.reduce((sum, v) => sum + countCheckable(v), 0), [visits]);
  const totalChecked = useMemo(() => Object.values(checked).filter(Boolean).length, [checked]);

  if (!data) {
    return (
      <View style={[s.c, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.textMuted }}>Ładowanie...</Text>
      </View>
    );
  }

  return (
    <AuroraBackground>
      <View style={s.container}>
        <ScrollView style={s.scroll}>
          <View style={s.header}>
            <Icon name="calendar" size={48} color={theme.colors.checkups} />
            <Text style={s.title}>Wizyty Lekarskie</Text>
            <Text style={s.sub}>Baza najważniejszych badań i kontroli w ciąży</Text>
          </View>

          <GlassCard accent="cyan" elevated style={s.progressCard}>
            <Text style={s.progressLabel}>Postęp badań</Text>
            <View style={s.progressRight}>
              <Text style={s.progressCount}>{totalChecked}/{totalItems}</Text>
              <Text style={s.progressCheckLabel}>odfajkowane zadania</Text>
            </View>
          </GlassCard>

          {visits.map((visit, vIdx) => {
            const isExpanded = expanded === vIdx;
            const visitItemCount = countCheckable(visit);
            const visitChecked = countCheckedInVisit(visit, vIdx, checked);
            const isLast = vIdx === visits.length - 1;
            const isDone = visitItemCount > 0 && visitChecked === visitItemCount;
            const visitColor = resolveColor(visit.colorKey, theme);

            return (
              <View key={vIdx} style={s.timelineRow}>
                <View style={s.timelineCol}>
                  <View style={[s.timelineDot, { backgroundColor: isDone ? theme.colors.primary : visitColor, shadowColor: isDone ? theme.colors.primary : visitColor }]} />
                  {!isLast ? <View style={s.timelineLine} /> : null}
                </View>
                <View style={s.timelineContent}>
                  <TouchableOpacity onPress={() => toggle(vIdx)} activeOpacity={0.85} accessibilityRole="button" accessibilityState={{ expanded: isExpanded }}>
                    <GlassCard style={s.visitHeader}>
                      <View style={s.visitHeaderLeft}>
                        <View style={[s.weekBadge, { backgroundColor: visitColor }]}>
                          <Text style={s.weekBadgeText}>{visit.weekRange}</Text>
                        </View>
                        <Text style={s.visitTitle}>{visit.title}</Text>
                        <Text style={s.visitSubtitle} numberOfLines={2}>{visit.subtitle}</Text>
                      </View>
                      <View style={s.visitHeaderRight}>
                        <Text style={[s.visitProgress, { color: isDone ? theme.colors.primary : theme.colors.textMuted }]}>
                          {visitChecked}/{visitItemCount}
                        </Text>
                        <Icon name={isExpanded ? 'expand-less' : 'expand-more'} size={24} color={theme.colors.textMuted} />
                      </View>
                    </GlassCard>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={s.visitContent}>
                      {visit.categories.map((cat, cIdx) => {
                        if (cat.singleCheck) {
                          const catKey = getCatKey(vIdx, cIdx);
                          const isCatDone = checked[catKey] || false;
                          return (
                            <View key={cIdx} style={s.catSection}>
                              <View style={[s.singleCheckRow, isCatDone && s.checkItemDone]}>
                                <TouchableOpacity
                                  onPress={() => onCheckboxPress(catKey, cat.title, visit.weekRange)}
                                  style={s.checkBtn}
                                  accessibilityRole="checkbox"
                                  accessibilityLabel={cat.title}
                                  accessibilityState={{ checked: isCatDone }}
                                >
                                  <Icon
                                    name={isCatDone ? 'check-circle' : 'checkbox-blank'}
                                    size={22}
                                    color={isCatDone ? theme.colors.primary : theme.colors.textMuted}
                                  />
                                </TouchableOpacity>
                                <View style={s.singleCheckInfo}>
                                  <View style={s.singleCheckTitle}>
                                    <Icon name={cat.icon} size={16} color={resolveColor(cat.colorKey, theme)} />
                                    <Text style={[s.catTitleInline, isCatDone && s.checkNameDone]}> {cat.title}</Text>
                                  </View>
                                  {cat.items.map((item, iIdx) => (
                                    <View key={iIdx} style={s.subItem}>
                                      <Text style={s.subDot}>•</Text>
                                      <Text style={[s.subItemText, isCatDone && s.subItemTextDone]}>
                                        {item.optional && <Text style={s.optional}>(opcja) </Text>}
                                        {item.name}
                                        {item.note ? <Text style={s.subItemNote}> – {item.note}</Text> : null}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            </View>
                          );
                        }

                        return (
                          <View key={cIdx} style={s.catSection}>
                            <View style={s.catHeader}>
                              <Icon name={cat.icon} size={18} color={resolveColor(cat.colorKey, theme)} />
                              <Text style={s.catTitle}> {cat.title}</Text>
                              <Text style={[s.catCount, { color: resolveColor(cat.colorKey, theme) }]}>{cat.items.length}</Text>
                            </View>

                            {cat.items.map((item, iIdx) => {
                              const key = getItemKey(vIdx, cIdx, iIdx);
                              const isItemDone = checked[key] || false;
                              return (
                                <View key={iIdx} style={[s.checkItem, isItemDone && s.checkItemDone]}>
                                  <TouchableOpacity
                                    onPress={() => onCheckboxPress(key, item.name, visit.weekRange)}
                                    style={s.checkBtn}
                                    accessibilityRole="checkbox"
                                    accessibilityLabel={item.name}
                                    accessibilityState={{ checked: isItemDone }}
                                  >
                                    <Icon
                                      name={isItemDone ? 'check-circle' : 'checkbox-blank'}
                                      size={22}
                                      color={isItemDone ? theme.colors.primary : theme.colors.textMuted}
                                    />
                                  </TouchableOpacity>
                                  <View style={s.checkInfo}>
                                    <Text style={[s.checkName, isItemDone && s.checkNameDone]}>
                                      {item.optional && <Text style={s.optional}>(opcja) </Text>}
                                      {item.name}
                                    </Text>
                                    {item.note && <Text style={s.checkNote}>{item.note}</Text>}
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          <View style={s.disclaimer}>
            <Icon name="info" size={16} color={theme.colors.textMuted} />
            <Text style={s.disclaimerText}>Powyższa lista jest orientacyjna. O dokładnych badaniach, ich ilości i częstotliwości decyduje wyłącznie lekarz prowadzący ciążę, który na bieżąco analizuje stan zdrowia kobiety i dziecka.</Text>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {pendingExam && (
        <AddExamSheet
          visible
          examName={pendingExam.examName}
          week={parseFirstWeek(pendingExam.weekRange)}
          onCancel={handleSheetCancel}
          onSubmit={handleSheetSubmit}
        />
      )}
    </AuroraBackground>
  );
}

const createStyles = (theme: Theme, topInset: number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  c: { flex: 1, backgroundColor: 'transparent' },
  header: { alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingTop: topInset + 16, paddingBottom: theme.spacing.lg },
  title: { fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.title, fontVariationSettings: '"wght" 700', color: theme.colors.checkups, marginBottom: 4 },
  sub: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary },
  progressCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.lg, minHeight: 90 },
  progressLabel: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, flex: 1, marginRight: 12 },
  progressRight: { alignItems: 'flex-end' },
  progressCount: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.primary },
  progressCheckLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },
  timelineRow: { flexDirection: 'row', alignItems: 'stretch', marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md },
  timelineCol: { width: 24, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 14, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  timelineLine: { flex: 1, width: 2, backgroundColor: theme.colors.cardBorder, marginTop: 6 },
  timelineContent: { flex: 1, marginLeft: theme.spacing.sm },
  visitHeader: { padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center' },
  visitHeaderLeft: { flex: 1 },
  weekBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
  weekBadgeText: { fontSize: 11, fontWeight: theme.fontWeight.semibold, color: '#FFFFFF' },
  visitTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  visitSubtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2 },
  visitHeaderRight: { alignItems: 'flex-end', marginLeft: theme.spacing.sm },
  visitProgress: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, marginBottom: 4 },
  visitContent: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, marginTop: 4, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.cardBorder },
  catSection: { marginBottom: 16 },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  catTitle: { fontSize: 13, fontFamily: theme.fonts.semibold, color: theme.colors.text, flex: 1 },
  catCount: { fontSize: 11, fontFamily: theme.fonts.semibold, backgroundColor: theme.colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, color: theme.colors.textMuted },
  singleCheckRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder },
  singleCheckInfo: { flex: 1, marginRight: 8 },
  singleCheckTitle: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  catTitleInline: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  subItem: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 4, marginBottom: 2 },
  subDot: { color: theme.colors.textMuted, fontSize: 12, marginRight: 6, marginTop: 1 },
  subItemText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 18, flex: 1 },
  subItemTextDone: { color: theme.colors.textMuted },
  subItemNote: { fontStyle: 'italic', color: theme.colors.textMuted },
  checkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder },
  checkItemDone: { opacity: 0.55 },
  checkBtn: { marginRight: 10 },
  checkInfo: { flex: 1, marginRight: 8 },
  checkName: { fontSize: theme.fontSize.sm, color: theme.colors.text, lineHeight: 20 },
  checkNameDone: { textDecorationLine: 'line-through', color: theme.colors.textMuted },
  optional: { color: theme.colors.textMuted, fontStyle: 'italic', fontSize: theme.fontSize.xs },
  checkNote: { fontSize: 11, color: theme.colors.textMuted, fontStyle: 'italic', marginTop: 1 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg, padding: theme.spacing.xl, backgroundColor: theme.colors.surfaceLight, borderRadius: theme.borderRadius.xl },
  disclaimerText: { flex: 1, fontSize: 11, color: theme.colors.textMuted, lineHeight: 16, fontStyle: 'italic' },
});
```

Note vs. previous version:
- Removed: `addToCalendar`, `getDefaultCalendarId`, `s.calBtn` style, ikona kalendarza obok każdego badania, `import * as Calendar from 'expo-calendar'`.
- Added: dialog flows, `AddExamSheet` integration, journal entry creation.
- `getItemKey`/`getCatKey` zwracają teraz `checkup-v0-c1-i2` (z prefiksem) — zgodne ze spec'iem.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd mobile && npx jest src/screens/__tests__/CheckupsScreen.flow.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Run full test suite**

Run: `cd mobile && npm test`
Expected: All tests pass.

- [ ] **Step 6: Run typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Manual smoke test (if device available)**

Build APK or use Expo Go, then verify:
- klik niezaznaczonego badania → dialog "Dodać do kalendarza?"
- "Nie" → odhacza, brak innych zmian
- "Tak" → otwiera sheet, defaulty: jutro 9:00, 1h
- "Zapisz" w sheet → event w kalendarzu telefonu (sprawdź ręcznie), wpis w dzienniku w zakładce "badania"
- klik odhaczonego (z eventem) → dialog "Usunąć z kalendarza?"
- "Tak" → event znika z kalendarza, badanie odznaczone
- "Nie" → tylko odznacza, event pozostaje

- [ ] **Step 8: Commit**

```bash
cd mobile
git add src/screens/CheckupsScreen.tsx src/screens/__tests__/
git commit -m "feat(checkups): integrate calendar prompt + journal entry flow"
```

---

## Self-Review

**Spec coverage:**
- ✅ Usunięcie osobnego przycisku kalendarza → Task 4 (usunięty `s.calBtn` i `addToCalendar`)
- ✅ Dialog "tak/nie" przy zaznaczeniu → Task 4 (`promptCheck`)
- ✅ Sheet z polami (data/godzina/czas trwania/lekarz/miejsce/notatka) → Task 3
- ✅ 3 alarmy (-2880, -1440, -120) → Task 2 (`EXAM_ALARMS`)
- ✅ Wpis w dzienniku typu `exam` z `linkedExamId` → Task 4 (`addJournalEntry` call)
- ✅ Migracja state z boolean → object → Task 1 (`migrate()`)
- ✅ Dialog "Usunąć z kalendarza?" przy odznaczaniu → Task 4 (`promptUncheck`)
- ✅ Wpis w dzienniku zostaje przy odznaczaniu → Task 4 (nigdy nie wołamy `deleteEntry`)
- ✅ Brak `calendarEventId` → bez pytania, tylko odznacza → Task 4 (`if (!meta?.calendarEventId)`)
- ✅ Anulowanie sheet → badanie pozostaje odhaczone (opcja C) → Task 4 (`handleAddConfirmed` ustawia `setCheckedWithMeta(key, true)` przed otwarciem sheet'u)
- ✅ Permission denied → wpis w dzienniku tworzony mimo to → Task 4 (`createExamEvent` zwraca null, `addJournalEntry` woła się niezależnie)

**Placeholder scan:** brak TBD, wszystkie kroki mają konkretny kod, wszystkie testy mają assertions.

**Type consistency:**
- `setCheckedWithMeta(key, isChecked, meta?)` — używane spójnie w Task 1 (definicja) i Task 4 (wołanie).
- `getMeta(key): ChecklistItemMeta | undefined` — Task 1 i Task 4 spójne.
- `createExamEvent({ title, start, end, doctor?, location?, notes? })` — Task 2 i Task 4 spójne.
- `ExamSubmitPayload` — Task 3 (eksport) i Task 4 (import) spójne.
- `getItemKey`/`getCatKey` zwracają string z prefiksem `checkup-` — zgodne ze spec.

Plan gotowy.
