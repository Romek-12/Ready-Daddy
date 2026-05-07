# Journal Calendar View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać do `JournalScreen` toggle "Lista | Kalendarz". W trybie kalendarza siatka miesiąca pokazuje cyfrę dnia + tydzień+dzień ciąży ("21+3") + kropkę gdy są wpisy. Wybrany dzień rozwija się inline pod siatką z listą wpisów + przyciskiem "+ Dodaj wizytę" otwierającym `AddExamSheet` z prefilled datą.

**Architecture:** Czysty util `pregnancyWeek` liczy {week, day} z conceptionDate i Date. `CalendarMonthGrid` jest stateless prezentacją. `JournalCalendarView` trzyma stan miesiąca/wybranego dnia i orkiestruje submit nowej wizyty (createExamEvent + addJournalEntry). `AddExamSheet` rozszerzony o `defaultDate` i `editableName`. `JournalScreen` zyskuje toggle + persistence w AsyncStorage.

**Tech Stack:** React Native 0.81 + Expo 55, TypeScript 5.8 strict, Jest + @testing-library/react-native, AsyncStorage, LayoutAnimation (built-in).

**Spec:** `docs/superpowers/specs/2026-05-07-journal-calendar-view-design.md`

---

## File Structure

**Nowe:**
- `mobile/src/utils/pregnancyWeek.ts` — `getPregnancyWeekAndDay`, `formatWeekDay`
- `mobile/src/utils/__tests__/pregnancyWeek.test.ts`
- `mobile/src/components/journal/CalendarMonthGrid.tsx` — siatka 7×6
- `mobile/src/components/journal/CalendarDayDetail.tsx` — inline expansion
- `mobile/src/components/journal/JournalCalendarView.tsx` — kontener stanu
- `mobile/src/components/journal/__tests__/CalendarMonthGrid.test.tsx`
- `mobile/src/components/journal/__tests__/JournalCalendarView.test.tsx`

**Zmienione:**
- `mobile/src/components/checkups/AddExamSheet.tsx` — `defaultDate?: Date`, `editableName?: boolean`
- `mobile/src/components/checkups/__tests__/AddExamSheet.test.tsx` — testy nowych propsów
- `mobile/src/screens/journal/JournalScreen.tsx` — toggle Lista/Kalendarz z persistence

---

## Task 1: `pregnancyWeek` util

**Files:**
- Create: `mobile/src/utils/pregnancyWeek.ts`
- Create: `mobile/src/utils/__tests__/pregnancyWeek.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `mobile/src/utils/__tests__/pregnancyWeek.test.ts`:

```typescript
import { getPregnancyWeekAndDay, formatWeekDay } from '../pregnancyWeek';

describe('getPregnancyWeekAndDay', () => {
  it('returns week+day for date after conception (with offset)', () => {
    // conception 2026-01-01, target 2026-01-22 → 21 days after, +14 offset = 35 days = 5 weeks + 0 days
    const result = getPregnancyWeekAndDay('2026-01-01', new Date(2026, 0, 22));
    expect(result).toEqual({ week: 5, day: 0 });
  });

  it('returns week+day with non-zero day component', () => {
    // conception 2026-01-01, target 2026-01-25 → 24 days, +14 offset = 38 days = 5 weeks + 3 days
    const result = getPregnancyWeekAndDay('2026-01-01', new Date(2026, 0, 25));
    expect(result).toEqual({ week: 5, day: 3 });
  });

  it('returns null for date before conception (after offset)', () => {
    // conception 2026-03-01, target 2026-01-01 — way before, even with +14 days offset
    const result = getPregnancyWeekAndDay('2026-03-01', new Date(2026, 0, 1));
    expect(result).toBeNull();
  });

  it('clamps to {week: 42, day: 0} for date past 42+0', () => {
    // conception 2025-01-01, target 2026-12-01 — way after 42 weeks
    const result = getPregnancyWeekAndDay('2025-01-01', new Date(2026, 11, 1));
    expect(result).toEqual({ week: 42, day: 0 });
  });

  it('handles same day as conception', () => {
    // conception 2026-01-01, target 2026-01-01 → 0 days + 14 offset = 14 days = 2+0
    const result = getPregnancyWeekAndDay('2026-01-01', new Date(2026, 0, 1));
    expect(result).toEqual({ week: 2, day: 0 });
  });
});

describe('formatWeekDay', () => {
  it('formats {week, day} as "week+day"', () => {
    expect(formatWeekDay({ week: 21, day: 3 })).toBe('21+3');
    expect(formatWeekDay({ week: 22, day: 0 })).toBe('22+0');
    expect(formatWeekDay({ week: 5, day: 6 })).toBe('5+6');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd c:/Dev/mobile && npx jest src/utils/__tests__/pregnancyWeek.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the util**

Create `mobile/src/utils/pregnancyWeek.ts`:

```typescript
import { CONCEPTION_OFFSET_WEEKS, MAX_PREGNANCY_WEEK } from '../constants';

export interface WeekAndDay {
  week: number;
  day: number;
}

const MS_PER_DAY = 86400000;

/**
 * Compute pregnancy week+day (gestational age) for a target date given the conception date.
 * Returns null if target is before the start of pregnancy (after applying CONCEPTION_OFFSET_WEEKS).
 * Clamps to {week: MAX_PREGNANCY_WEEK, day: 0} when past the maximum.
 */
export function getPregnancyWeekAndDay(
  conceptionDate: string,
  target: Date,
): WeekAndDay | null {
  const conception = new Date(conceptionDate);
  // Normalize both to start-of-day to avoid DST/time-of-day drift
  const conceptionDayUtc = Date.UTC(conception.getFullYear(), conception.getMonth(), conception.getDate());
  const targetDayUtc = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.floor((targetDayUtc - conceptionDayUtc) / MS_PER_DAY);
  const totalDays = diffDays + CONCEPTION_OFFSET_WEEKS * 7;
  if (totalDays < 0) return null;
  const week = Math.floor(totalDays / 7);
  const day = totalDays % 7;
  if (week >= MAX_PREGNANCY_WEEK) return { week: MAX_PREGNANCY_WEEK, day: 0 };
  return { week, day };
}

export function formatWeekDay({ week, day }: WeekAndDay): string {
  return `${week}+${day}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd c:/Dev/mobile && npx jest src/utils/__tests__/pregnancyWeek.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Run typecheck**

Run: `cd c:/Dev/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd c:/Dev/mobile
git add src/utils/pregnancyWeek.ts src/utils/__tests__/pregnancyWeek.test.ts
git commit -m "feat(utils): add pregnancyWeek helper for week+day calculation"
```

---

## Task 2: Rozszerzenie `AddExamSheet` o `defaultDate` i `editableName`

**Files:**
- Modify: `mobile/src/components/checkups/AddExamSheet.tsx`
- Modify: `mobile/src/components/checkups/__tests__/AddExamSheet.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append to `mobile/src/components/checkups/__tests__/AddExamSheet.test.tsx` (inside the `describe('AddExamSheet', () => { ... })` block, after existing tests):

```typescript
  it('uses defaultDate when provided (sets time to 09:00)', async () => {
    const onSubmit = jest.fn();
    const customDate = new Date(2026, 5, 15); // 15 June 2026
    const { getByText } = render(
      wrap(<AddExamSheet visible examName="USG" week={20} defaultDate={customDate} onCancel={jest.fn()} onSubmit={onSubmit} />),
    );
    fireEvent.press(getByText('Zapisz'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.start.getFullYear()).toBe(2026);
    expect(payload.start.getMonth()).toBe(5);
    expect(payload.start.getDate()).toBe(15);
    expect(payload.start.getHours()).toBe(9);
    expect(payload.start.getMinutes()).toBe(0);
  });

  it('renders editable name input when editableName=true', () => {
    const { getByPlaceholderText, queryByText } = render(
      wrap(<AddExamSheet visible examName="" week={20} editableName onCancel={jest.fn()} onSubmit={jest.fn()} />),
    );
    expect(getByPlaceholderText('Nazwa badania')).toBeTruthy();
    expect(queryByText('USG')).toBeNull();
  });

  it('disables Zapisz button when editableName=true and name is empty', () => {
    const onSubmit = jest.fn();
    const { getByText } = render(
      wrap(<AddExamSheet visible examName="" week={20} editableName onCancel={jest.fn()} onSubmit={onSubmit} />),
    );
    fireEvent.press(getByText('Zapisz'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('enables Zapisz and submits with typed name when editableName=true', async () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      wrap(<AddExamSheet visible examName="" week={20} editableName onCancel={jest.fn()} onSubmit={onSubmit} />),
    );
    fireEvent.changeText(getByPlaceholderText('Nazwa badania'), 'Morfologia');
    fireEvent.press(getByText('Zapisz'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.name).toBe('Morfologia');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd c:/Dev/mobile && npx jest src/components/checkups/__tests__/AddExamSheet.test.tsx`
Expected: FAIL — `defaultDate`, `editableName`, `payload.name` not supported.

- [ ] **Step 3: Update `ExamSubmitPayload` and props**

In `mobile/src/components/checkups/AddExamSheet.tsx`, find:

```typescript
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
```

Replace with:

```typescript
export interface ExamSubmitPayload {
  start: Date;
  end: Date;
  doctor?: string;
  location?: string;
  notes?: string;
  /** Present only when editableName=true and user typed a name. */
  name?: string;
}

interface Props {
  visible: boolean;
  examName: string;
  week: number;
  onCancel: () => void;
  onSubmit: (payload: ExamSubmitPayload) => void;
  /** When provided, initial date is this date at 09:00 instead of tomorrow at 09:00. */
  defaultDate?: Date;
  /** When true, examName is shown as TextInput (user types it). Submit disabled if empty. */
  editableName?: boolean;
}
```

- [ ] **Step 4: Apply `defaultDate` and `editableName` logic**

In the same file, replace the `tomorrowAt9` usage and the component body. Find:

```typescript
function tomorrowAt9(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

export default function AddExamSheet({ visible, examName, week, onCancel, onSubmit }: Props) {
```

Replace with:

```typescript
function tomorrowAt9(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

function dateAt9(source: Date): Date {
  const d = new Date(source);
  d.setHours(9, 0, 0, 0);
  return d;
}

export default function AddExamSheet({ visible, examName, week, onCancel, onSubmit, defaultDate, editableName = false }: Props) {
```

Find the state initializer:

```typescript
  const [date, setDate] = useState<Date>(tomorrowAt9);
```

Replace with:

```typescript
  const initialDate = () => (defaultDate ? dateAt9(defaultDate) : tomorrowAt9());
  const [date, setDate] = useState<Date>(initialDate);
  const [typedName, setTypedName] = useState<string>(examName);
```

Find the `useEffect` reset block:

```typescript
  useEffect(() => {
    if (visible) {
      setDate(tomorrowAt9());
      setDurationMinutes(60);
      setDoctor('');
      setLocation('');
      setNotes('');
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
  }, [visible]);
```

Replace with:

```typescript
  useEffect(() => {
    if (visible) {
      setDate(initialDate());
      setDurationMinutes(60);
      setDoctor('');
      setLocation('');
      setNotes('');
      setTypedName(examName);
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, examName, defaultDate]);
```

Find the `handleSubmit` function:

```typescript
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
```

Replace with:

```typescript
  const trimmedName = typedName.trim();
  const submitDisabled = editableName && trimmedName.length === 0;

  const handleSubmit = () => {
    if (submitDisabled) return;
    const start = date;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    onSubmit({
      start,
      end,
      doctor: doctor.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      name: editableName ? trimmedName : undefined,
    });
  };
```

Find the section that displays exam name (read-only Text):

```typescript
            <GlassCard style={s.section}>
              <Text style={s.examName}>{examName}</Text>
              <Text style={s.weekLabel}>Tydzień: {week}</Text>
            </GlassCard>
```

Replace with:

```typescript
            <GlassCard style={s.section}>
              {editableName ? (
                <TextInput
                  style={s.nameInput}
                  placeholder="Nazwa badania"
                  placeholderTextColor={theme.colors.textMuted}
                  value={typedName}
                  onChangeText={setTypedName}
                />
              ) : (
                <Text style={s.examName}>{examName}</Text>
              )}
              <Text style={s.weekLabel}>Tydzień: {week}</Text>
            </GlassCard>
```

Find the Zapisz button. The line:

```typescript
            <TouchableOpacity onPress={handleSubmit} accessibilityRole="button">
              <Text style={[s.headerBtn, s.headerBtnPrimary]}>Zapisz</Text>
            </TouchableOpacity>
```

Replace with:

```typescript
            <TouchableOpacity
              onPress={handleSubmit}
              accessibilityRole="button"
              accessibilityState={{ disabled: submitDisabled }}
              disabled={submitDisabled}
            >
              <Text style={[s.headerBtn, s.headerBtnPrimary, submitDisabled && s.headerBtnDisabled]}>Zapisz</Text>
            </TouchableOpacity>
```

In `createStyles`, find:

```typescript
  examName: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
```

Add right after it (still inside the `StyleSheet.create({ ... })` object):

```typescript
  nameInput: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    paddingVertical: theme.spacing.xs,
  },
  headerBtnDisabled: { opacity: 0.4 },
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd c:/Dev/mobile && npx jest src/components/checkups/__tests__/AddExamSheet.test.tsx`
Expected: PASS (9 tests — 5 existing + 4 new).

- [ ] **Step 6: Run typecheck**

Run: `cd c:/Dev/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd c:/Dev/mobile
git add src/components/checkups/AddExamSheet.tsx src/components/checkups/__tests__/AddExamSheet.test.tsx
git commit -m "feat(checkups): support defaultDate and editableName in AddExamSheet"
```

---

## Task 3: `CalendarMonthGrid` komponent

**Files:**
- Create: `mobile/src/components/journal/CalendarMonthGrid.tsx`
- Create: `mobile/src/components/journal/__tests__/CalendarMonthGrid.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `mobile/src/components/journal/__tests__/CalendarMonthGrid.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CalendarMonthGrid from '../CalendarMonthGrid';
import { ThemeProvider } from '../../../context/ThemeContext';

const wrap = (ui: React.ReactElement) => <ThemeProvider>{ui}</ThemeProvider>;

describe('CalendarMonthGrid', () => {
  const noop = jest.fn();

  beforeEach(() => noop.mockClear());

  it('renders 42 day cells', () => {
    const { getAllByTestId } = render(
      wrap(<CalendarMonthGrid monthDate={new Date(2026, 4, 1)} selectedDate={null} entriesByDay={{}} onSelectDay={noop} />),
    );
    expect(getAllByTestId(/day-cell-/)).toHaveLength(42);
  });

  it('first cell is the Monday on or before the 1st (May 2026 → April 27)', () => {
    const { getByTestId } = render(
      wrap(<CalendarMonthGrid monthDate={new Date(2026, 4, 1)} selectedDate={null} entriesByDay={{}} onSelectDay={noop} />),
    );
    // May 1, 2026 is a Friday → Monday on or before is April 27
    expect(getByTestId('day-cell-2026-04-27')).toBeTruthy();
  });

  it('renders dot when entriesByDay[isoDate].length > 0', () => {
    const { getByTestId, queryByTestId } = render(
      wrap(<CalendarMonthGrid
        monthDate={new Date(2026, 4, 1)}
        selectedDate={null}
        entriesByDay={{ '2026-05-07': [{ id: 'e1' } as never] }}
        onSelectDay={noop}
      />),
    );
    expect(getByTestId('day-cell-2026-05-07-dot')).toBeTruthy();
    expect(queryByTestId('day-cell-2026-05-08-dot')).toBeNull();
  });

  it('renders week+day label when conceptionDate provided and date in range', () => {
    const { getByTestId } = render(
      wrap(<CalendarMonthGrid
        monthDate={new Date(2026, 4, 1)}
        selectedDate={null}
        entriesByDay={{}}
        conceptionDate="2026-01-01"
        onSelectDay={noop}
      />),
    );
    // 2026-05-07 is 126 days after conception, +14 offset = 140 days = 20 weeks exactly
    expect(getByTestId('day-cell-2026-05-07-weekday').props.children).toBe('20+0');
  });

  it('does not render week+day label when conceptionDate missing', () => {
    const { queryByTestId } = render(
      wrap(<CalendarMonthGrid monthDate={new Date(2026, 4, 1)} selectedDate={null} entriesByDay={{}} onSelectDay={noop} />),
    );
    expect(queryByTestId('day-cell-2026-05-07-weekday')).toBeNull();
  });

  it('calls onSelectDay with the cell date on press', () => {
    const onSelectDay = jest.fn();
    const { getByTestId } = render(
      wrap(<CalendarMonthGrid monthDate={new Date(2026, 4, 1)} selectedDate={null} entriesByDay={{}} onSelectDay={onSelectDay} />),
    );
    fireEvent.press(getByTestId('day-cell-2026-05-07'));
    expect(onSelectDay).toHaveBeenCalledTimes(1);
    const callArg = onSelectDay.mock.calls[0][0] as Date;
    expect(callArg.getFullYear()).toBe(2026);
    expect(callArg.getMonth()).toBe(4);
    expect(callArg.getDate()).toBe(7);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd c:/Dev/mobile && npx jest src/components/journal/__tests__/CalendarMonthGrid.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `CalendarMonthGrid`**

Create `mobile/src/components/journal/CalendarMonthGrid.tsx`:

```typescript
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getPregnancyWeekAndDay, formatWeekDay } from '../../utils/pregnancyWeek';
import type { JournalEntry } from '../../types/journal.types';
import type { Theme } from '../../theme';

interface Props {
  monthDate: Date;
  selectedDate: Date | null;
  entriesByDay: Record<string, JournalEntry[]>;
  conceptionDate?: string;
  onSelectDay: (date: Date) => void;
}

const WEEKDAY_HEADERS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Returns the Monday on-or-before the 1st day of the given month.
 * (PL convention: weeks start Monday.)
 */
function gridStart(monthDate: Date): Date {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  // JS getDay: 0=Sunday..6=Saturday. We want Monday (1) as start.
  const dow = first.getDay();
  const offsetToMonday = dow === 0 ? 6 : dow - 1; // Sunday → 6 days back; otherwise (dow - 1) days back
  const start = new Date(first);
  start.setDate(first.getDate() - offsetToMonday);
  return start;
}

export default function CalendarMonthGrid({ monthDate, selectedDate, entriesByDay, conceptionDate, onSelectDay }: Props) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  const cells = useMemo(() => {
    const start = gridStart(monthDate);
    const out: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(d);
    }
    return out;
  }, [monthDate]);

  const today = new Date();
  const currentMonth = monthDate.getMonth();

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        {WEEKDAY_HEADERS.map(label => (
          <Text key={label} style={s.headerLabel}>{label}</Text>
        ))}
      </View>
      <View style={s.grid}>
        {cells.map(date => {
          const iso = toIsoDate(date);
          const inCurrentMonth = date.getMonth() === currentMonth;
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const hasEntries = (entriesByDay[iso]?.length ?? 0) > 0;
          const wd = conceptionDate ? getPregnancyWeekAndDay(conceptionDate, date) : null;

          return (
            <TouchableOpacity
              key={iso}
              testID={`day-cell-${iso}`}
              style={s.cell}
              onPress={() => onSelectDay(date)}
              accessibilityRole="button"
              accessibilityLabel={`Dzień ${date.getDate()}${wd ? `, ${formatWeekDay(wd)}` : ''}`}
              accessibilityState={{ selected: isSelected }}
            >
              <View style={[
                s.dayNumberWrap,
                isSelected && s.dayNumberWrapSelected,
                !isSelected && isToday && s.dayNumberWrapToday,
              ]}>
                <Text style={[
                  s.dayNumber,
                  !inCurrentMonth && s.dayNumberMuted,
                  isSelected && s.dayNumberSelected,
                ]}>
                  {date.getDate()}
                </Text>
              </View>
              {wd ? (
                <Text testID={`day-cell-${iso}-weekday`} style={s.weekDay}>{formatWeekDay(wd)}</Text>
              ) : (
                <Text style={s.weekDayPlaceholder} />
              )}
              {hasEntries ? <View testID={`day-cell-${iso}-dot`} style={s.dot} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { paddingHorizontal: theme.spacing.sm },
  headerRow: { flexDirection: 'row', paddingVertical: theme.spacing.xs },
  headerLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.medium,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    height: 56,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 4,
  },
  dayNumberWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberWrapSelected: { backgroundColor: theme.colors.primary },
  dayNumberWrapToday: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  dayNumber: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  dayNumberMuted: { color: theme.colors.textMuted },
  dayNumberSelected: { color: theme.colors.background, fontWeight: theme.fontWeight.bold },
  weekDay: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  weekDayPlaceholder: {
    fontSize: theme.fontSize.xs,
    marginTop: 2,
  },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd c:/Dev/mobile && npx jest src/components/journal/__tests__/CalendarMonthGrid.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Run typecheck**

Run: `cd c:/Dev/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd c:/Dev/mobile
git add src/components/journal/CalendarMonthGrid.tsx src/components/journal/__tests__/CalendarMonthGrid.test.tsx
git commit -m "feat(journal): add CalendarMonthGrid component"
```

---

## Task 4: `JournalCalendarView` kontener z stanem

**Files:**
- Create: `mobile/src/components/journal/CalendarDayDetail.tsx`
- Create: `mobile/src/components/journal/JournalCalendarView.tsx`
- Create: `mobile/src/components/journal/__tests__/JournalCalendarView.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `mobile/src/components/journal/__tests__/JournalCalendarView.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import JournalCalendarView from '../JournalCalendarView';
import { ThemeProvider } from '../../../context/ThemeContext';
import * as useJournalHook from '../../../hooks/useJournal';
import * as AuthContext from '../../../context/AuthContext';
import * as CalendarService from '../../../services/calendar/CalendarService';
import * as JournalService from '../../../services/journal/JournalService';
import type { JournalEntry } from '../../../types/journal.types';

jest.mock('../../../services/calendar/CalendarService');
jest.mock('../../../services/journal/JournalService');

const wrap = (ui: React.ReactElement) => <ThemeProvider>{ui}</ThemeProvider>;

const mockEntry = (overrides: Partial<JournalEntry>): JournalEntry => ({
  id: 'e1',
  type: 'exam',
  title: 'USG',
  date: '2026-05-07',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

const reload = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(useJournalHook, 'useJournal').mockReturnValue({
    entries: [mockEntry({ id: 'e1', date: '2026-05-07', title: 'USG' })],
    loading: false,
    reload,
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as never);
  jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user: { id: 'u1', email: 't@t.t', conceptionDate: '2026-01-01', partnerName: null, babyName1: null, babyName2: null, babyGender: null },
    loading: false,
  } as never);
  (CalendarService.createExamEvent as jest.Mock).mockResolvedValue('evt-1');
  (JournalService.addEntry as jest.Mock).mockResolvedValue(mockEntry({ id: 'e2' }));
});

describe('JournalCalendarView', () => {
  it('renders the current month by default', () => {
    const now = new Date();
    const monthName = now.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
    const { getByText } = render(wrap(<JournalCalendarView />));
    expect(getByText(new RegExp(monthName, 'i'))).toBeTruthy();
  });

  it('navigates to next month when ▶ pressed', () => {
    const { getByLabelText, getByText } = render(wrap(<JournalCalendarView />));
    fireEvent.press(getByLabelText('Następny miesiąc'));
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    const monthName = next.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
    expect(getByText(new RegExp(monthName, 'i'))).toBeTruthy();
  });

  it('navigates to previous month when ◀ pressed', () => {
    const { getByLabelText, getByText } = render(wrap(<JournalCalendarView />));
    fireEvent.press(getByLabelText('Poprzedni miesiąc'));
    const prev = new Date();
    prev.setMonth(prev.getMonth() - 1);
    const monthName = prev.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
    expect(getByText(new RegExp(monthName, 'i'))).toBeTruthy();
  });

  it('shows entries for the selected day in the inline expansion', () => {
    const { getByTestId, getByText } = render(wrap(<JournalCalendarView initialMonthDate={new Date(2026, 4, 1)} initialSelectedDate={new Date(2026, 4, 7)} />));
    expect(getByTestId('day-cell-2026-05-07')).toBeTruthy();
    expect(getByText('USG')).toBeTruthy();
  });

  it('opens AddExamSheet with prefilled date when "Dodaj wizytę" pressed', () => {
    const { getByText } = render(wrap(<JournalCalendarView initialMonthDate={new Date(2026, 4, 1)} initialSelectedDate={new Date(2026, 4, 15)} />));
    fireEvent.press(getByText('+ Dodaj wizytę'));
    // Sheet renders header
    expect(getByText('Dodaj badanie')).toBeTruthy();
  });

  it('on sheet submit creates exam event + journal entry and reloads', async () => {
    const { getByText, getByPlaceholderText } = render(wrap(<JournalCalendarView initialMonthDate={new Date(2026, 4, 1)} initialSelectedDate={new Date(2026, 4, 15)} />));
    fireEvent.press(getByText('+ Dodaj wizytę'));
    fireEvent.changeText(getByPlaceholderText('Nazwa badania'), 'Morfologia');
    fireEvent.press(getByText('Zapisz'));
    await waitFor(() => expect(CalendarService.createExamEvent).toHaveBeenCalled());
    expect(JournalService.addEntry).toHaveBeenCalledWith(expect.objectContaining({
      type: 'exam',
      title: 'Morfologia',
      date: '2026-05-15',
    }));
    await waitFor(() => expect(reload).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd c:/Dev/mobile && npx jest src/components/journal/__tests__/JournalCalendarView.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `CalendarDayDetail`**

Create `mobile/src/components/journal/CalendarDayDetail.tsx`:

```typescript
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import EntryCard from './EntryCard';
import Icon from '../Icon';
import GlassCard from '../ui/GlassCard';
import { formatWeekDay, type WeekAndDay } from '../../utils/pregnancyWeek';
import type { JournalEntry } from '../../types/journal.types';
import type { Theme } from '../../theme';

interface Props {
  date: Date;
  entries: JournalEntry[];
  weekDay: WeekAndDay | null;
  onAddVisit: () => void;
  onEntryPress: (entryId: string) => void;
}

export default function CalendarDayDetail({ date, entries, weekDay, onAddVisit, onEntryPress }: Props) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  const dateLabel = date.toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Text style={s.dateLabel}>{dateLabel}</Text>
        {weekDay ? <Text style={s.weekDayLabel}>· {formatWeekDay(weekDay)}</Text> : null}
      </View>

      {entries.length === 0 ? (
        <GlassCard style={s.empty}>
          <Text style={s.emptyText}>Brak wpisów na ten dzień</Text>
        </GlassCard>
      ) : (
        entries.map(entry => (
          <EntryCard key={entry.id} entry={entry} onPress={() => onEntryPress(entry.id)} />
        ))
      )}

      <TouchableOpacity style={s.addBtn} onPress={onAddVisit} accessibilityRole="button" accessibilityLabel="Dodaj wizytę">
        <Icon name="add" size={18} color={theme.colors.background} />
        <Text style={s.addBtnLabel}>+ Dodaj wizytę</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, gap: theme.spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.xs },
  dateLabel: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  weekDayLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontFamily: theme.fonts.medium },
  empty: { padding: theme.spacing.md, alignItems: 'center' },
  emptyText: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  addBtnLabel: { color: theme.colors.background, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.md },
});
```

Note: this file imports `EntryCard` from `./EntryCard`. The existing `EntryCard.tsx` lives in `mobile/src/components/journal/EntryCard.tsx`, so the relative import is correct.

- [ ] **Step 4: Implement `JournalCalendarView`**

Create `mobile/src/components/journal/JournalCalendarView.tsx`:

```typescript
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useJournal } from '../../hooks/useJournal';
import { createExamEvent } from '../../services/calendar/CalendarService';
import { addEntry as addJournalEntry } from '../../services/journal/JournalService';
import { getPregnancyWeekAndDay } from '../../utils/pregnancyWeek';
import { logError } from '../../utils/logError';
import CalendarMonthGrid from './CalendarMonthGrid';
import CalendarDayDetail from './CalendarDayDetail';
import AddExamSheet, { type ExamSubmitPayload } from '../checkups/AddExamSheet';
import Icon from '../Icon';
import type { JournalEntry } from '../../types/journal.types';
import type { Theme } from '../../theme';

interface Props {
  /** Test hook: override default monthDate (current month). */
  initialMonthDate?: Date;
  /** Test hook: override default selectedDate (today). */
  initialSelectedDate?: Date;
  /** Optional handler for entry tap (navigate to entry detail). */
  onEntryPress?: (entryId: string) => void;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function JournalCalendarView({ initialMonthDate, initialSelectedDate, onEntryPress }: Props) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuth();
  const { entries, reload } = useJournal();

  const [monthDate, setMonthDate] = useState<Date>(() => startOfMonth(initialMonthDate ?? new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => initialSelectedDate ?? new Date());
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  const entriesByDay = useMemo(() => {
    const out: Record<string, JournalEntry[]> = {};
    for (const entry of entries) {
      const key = entry.date;
      if (!out[key]) out[key] = [];
      out[key].push(entry);
    }
    return out;
  }, [entries]);

  const conceptionDate = user?.conceptionDate ?? undefined;

  const monthLabel = monthDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });

  const goPrevMonth = useCallback(() => {
    setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);
  const goNextMonth = useCallback(() => {
    setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleSelectDay = useCallback((d: Date) => {
    setSelectedDate(d);
  }, []);

  const handleAddVisit = useCallback(() => {
    if (!selectedDate) return;
    setPendingDate(selectedDate);
  }, [selectedDate]);

  const handleSheetCancel = useCallback(() => setPendingDate(null), []);

  const handleSheetSubmit = useCallback(async (payload: ExamSubmitPayload) => {
    if (!pendingDate) return;
    const date = pendingDate;
    setPendingDate(null);

    const title = payload.name?.trim() || 'Wizyta';

    const eventId = await createExamEvent({
      title: `Badanie: ${title}`,
      start: payload.start,
      end: payload.end,
      doctor: payload.doctor,
      location: payload.location,
      notes: payload.notes,
    });

    if (!eventId) {
      Alert.alert('Brak wydarzenia w kalendarzu', 'Nie udało się dodać wydarzenia. Wpis trafi tylko do dziennika.');
    }

    try {
      const wd = conceptionDate ? getPregnancyWeekAndDay(conceptionDate, payload.start) : null;
      await addJournalEntry({
        type: 'exam',
        title,
        date: toIsoDate(payload.start),
        week: wd?.week,
        notes: payload.notes,
        doctor: payload.doctor,
        location: payload.location,
        reminder: payload.start.toISOString(),
      });
      await reload();
    } catch (err: unknown) {
      logError('JournalCalendarView.addJournalEntry', err);
    }

    // Move selectedDate to the date the user picked in the sheet (may differ from prev selectedDate)
    setSelectedDate(new Date(payload.start.getFullYear(), payload.start.getMonth(), payload.start.getDate()));
    setMonthDate(startOfMonth(payload.start));
  }, [pendingDate, conceptionDate, reload]);

  const selectedIso = selectedDate ? toIsoDate(selectedDate) : null;
  const selectedEntries = selectedIso ? (entriesByDay[selectedIso] ?? []) : [];
  const selectedWeekDay = selectedDate && conceptionDate ? getPregnancyWeekAndDay(conceptionDate, selectedDate) : null;

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
      <View style={s.monthNav}>
        <TouchableOpacity onPress={goPrevMonth} accessibilityRole="button" accessibilityLabel="Poprzedni miesiąc" style={s.navBtn}>
          <Icon name="chevron-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={s.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={goNextMonth} accessibilityRole="button" accessibilityLabel="Następny miesiąc" style={s.navBtn}>
          <Icon name="chevron-right" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <CalendarMonthGrid
        monthDate={monthDate}
        selectedDate={selectedDate}
        entriesByDay={entriesByDay}
        conceptionDate={conceptionDate}
        onSelectDay={handleSelectDay}
      />

      {selectedDate ? (
        <CalendarDayDetail
          date={selectedDate}
          entries={selectedEntries}
          weekDay={selectedWeekDay}
          onAddVisit={handleAddVisit}
          onEntryPress={(id) => onEntryPress?.(id)}
        />
      ) : null}

      {pendingDate ? (
        <AddExamSheet
          visible
          examName=""
          editableName
          week={(() => {
            const wd = conceptionDate ? getPregnancyWeekAndDay(conceptionDate, pendingDate) : null;
            return wd?.week ?? 0;
          })()}
          defaultDate={pendingDate}
          onCancel={handleSheetCancel}
          onSubmit={handleSheetSubmit}
        />
      ) : null}
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: theme.spacing.xl },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  navBtn: { padding: theme.spacing.xs },
  monthLabel: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fonts.semibold,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd c:/Dev/mobile && npx jest src/components/journal/__tests__/JournalCalendarView.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 6: Run typecheck**

Run: `cd c:/Dev/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd c:/Dev/mobile
git add src/components/journal/CalendarDayDetail.tsx src/components/journal/JournalCalendarView.tsx src/components/journal/__tests__/JournalCalendarView.test.tsx
git commit -m "feat(journal): add JournalCalendarView with day detail and add-visit flow"
```

---

## Task 5: Toggle Lista/Kalendarz w `JournalScreen`

**Files:**
- Modify: `mobile/src/screens/journal/JournalScreen.tsx`
- Create: `mobile/src/screens/journal/__tests__/JournalScreen.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `mobile/src/screens/journal/__tests__/JournalScreen.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JournalScreen from '../JournalScreen';
import { ThemeProvider } from '../../../context/ThemeContext';
import * as useJournalHook from '../../../hooks/useJournal';
import * as AuthContext from '../../../context/AuthContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const navigation = { navigate: jest.fn() } as never;
const route = { key: 'k', name: 'JournalMain', params: undefined } as never;

const wrap = (ui: React.ReactElement) => <ThemeProvider>{ui}</ThemeProvider>;

beforeEach(() => {
  AsyncStorage.clear();
  jest.clearAllMocks();
  jest.spyOn(useJournalHook, 'useJournal').mockReturnValue({
    entries: [],
    loading: false,
    reload: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as never);
  jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user: { id: 'u1', email: 't@t.t', conceptionDate: '2026-01-01', partnerName: null, babyName1: null, babyName2: null, babyGender: null },
    loading: false,
  } as never);
});

describe('JournalScreen view toggle', () => {
  it('defaults to list view', async () => {
    const { getByText, queryByLabelText } = render(wrap(<JournalScreen navigation={navigation} route={route} />));
    expect(getByText('Wszystkie')).toBeTruthy();
    expect(queryByLabelText('Następny miesiąc')).toBeNull();
  });

  it('switches to calendar view when "Kalendarz" toggle pressed', async () => {
    const { getByText, getByLabelText } = render(wrap(<JournalScreen navigation={navigation} route={route} />));
    fireEvent.press(getByText('Kalendarz'));
    await waitFor(() => expect(getByLabelText('Następny miesiąc')).toBeTruthy());
  });

  it('persists toggle across remount via AsyncStorage', async () => {
    const { getByText, unmount } = render(wrap(<JournalScreen navigation={navigation} route={route} />));
    fireEvent.press(getByText('Kalendarz'));
    await waitFor(() => expect(AsyncStorage.getItem('journal_view_mode')).resolves.toBe('calendar'));
    unmount();

    const { getByLabelText } = render(wrap(<JournalScreen navigation={navigation} route={route} />));
    await waitFor(() => expect(getByLabelText('Następny miesiąc')).toBeTruthy());
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd c:/Dev/mobile && npx jest src/screens/journal/__tests__/JournalScreen.test.tsx`
Expected: FAIL — toggle not implemented.

- [ ] **Step 3: Add toggle to `JournalScreen`**

Replace the contents of `mobile/src/screens/journal/JournalScreen.tsx` with:

```typescript
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BlobLoader from '../../components/ui/BlobLoader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useJournal } from '../../hooks/useJournal';
import EntryCard from '../../components/journal/EntryCard';
import JournalCalendarView from '../../components/journal/JournalCalendarView';
import Icon from '../../components/Icon';
import AuroraBackground from '../../components/ui/AuroraBackground';
import { logError } from '../../utils/logError';
import type { JournalStackParamList } from '../../types/navigation';
import type { Theme } from '../../theme';
import { TAB_BAR_HEIGHT } from '../../constants';
import type { EntryType } from '../../types/journal.types';

type Props = NativeStackScreenProps<JournalStackParamList, 'JournalMain'>;
type ViewMode = 'list' | 'calendar';

const VIEW_MODE_STORAGE_KEY = 'journal_view_mode';

const FILTERS: { key: EntryType | 'all'; label: string }[] = [
  { key: 'all',       label: 'Wszystkie' },
  { key: 'visit',     label: 'Wizyty' },
  { key: 'exam',      label: 'Badania' },
  { key: 'milestone', label: 'Osiągnięcia' },
  { key: 'note',      label: 'Notatki' },
];

export default function JournalScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => createStyles(theme, insets.top, insets.bottom), [theme, insets.top, insets.bottom]);
  const { entries, loading, reload } = useJournal();
  const [activeFilter, setActiveFilter] = useState<EntryType | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    AsyncStorage.getItem(VIEW_MODE_STORAGE_KEY)
      .then(raw => {
        if (raw === 'list' || raw === 'calendar') setViewMode(raw);
      })
      .catch((e) => logError('JournalScreen:loadViewMode', e));
  }, []);

  const switchView = (mode: ViewMode) => {
    setViewMode(mode);
    AsyncStorage.setItem(VIEW_MODE_STORAGE_KEY, mode).catch((e) => logError('JournalScreen:persistViewMode', e));
  };

  useFocusEffect(
    React.useCallback(() => {
      reload();
    }, [reload]),
  );

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return entries;
    return entries.filter(e => e.type === activeFilter);
  }, [entries, activeFilter]);

  return (
    <AuroraBackground>
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Dziennik</Text>
        <TouchableOpacity
          style={s.addButton}
          onPress={() => navigation.navigate('AddEntry', {})}
          activeOpacity={0.8}
        >
          <Icon name="add" size={24} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

      {/* View toggle */}
      <View style={s.toggleRow}>
        <TouchableOpacity
          style={[s.toggleBtn, viewMode === 'list' && s.toggleBtnActive]}
          onPress={() => switchView('list')}
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === 'list' }}
          activeOpacity={0.75}
        >
          <Text style={[s.toggleLabel, viewMode === 'list' && s.toggleLabelActive]}>Lista</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.toggleBtn, viewMode === 'calendar' && s.toggleBtnActive]}
          onPress={() => switchView('calendar')}
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === 'calendar' }}
          activeOpacity={0.75}
        >
          <Text style={[s.toggleLabel, viewMode === 'calendar' && s.toggleLabelActive]}>Kalendarz</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'list' ? (
        <>
          {/* Filter chips */}
          <View style={s.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[s.chip, activeFilter === f.key && s.chipActive]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipLabel, activeFilter === f.key && s.chipLabelActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={s.center}>
              <BlobLoader variant="inline" />
            </View>
          ) : filtered.length === 0 ? (
            <View style={s.center}>
              <Icon name="journal" size={48} color={theme.colors.textMuted} />
              <Text style={s.empty}>Brak wpisów</Text>
              <Text style={s.emptySub}>Dodaj pierwszą wizytę, badanie lub notatkę</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <EntryCard
                  entry={item}
                  onPress={() => navigation.navigate('JournalEntry', { entryId: item.id })}
                />
              )}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      ) : (
        <JournalCalendarView
          onEntryPress={(id) => navigation.navigate('JournalEntry', { entryId: id })}
        />
      )}
    </View>
    </AuroraBackground>
  );
}

const createStyles = (theme: Theme, topInset: number, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: topInset + 16,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.fontSize.xxl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      fontFamily: theme.fonts.title,
      fontVariationSettings: '"wght" 700',
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    toggleRow: {
      flexDirection: 'row',
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      padding: 3,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: theme.borderRadius.full,
    },
    toggleBtnActive: { backgroundColor: theme.colors.primary },
    toggleLabel: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.textSecondary,
    },
    toggleLabelActive: { color: theme.colors.background },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      gap: 8,
      flexWrap: 'wrap',
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
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
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.textSecondary,
    },
    chipLabelActive: {
      color: theme.colors.background,
    },
    list: {
      paddingTop: theme.spacing.sm,
      paddingBottom: bottomInset + TAB_BAR_HEIGHT + 16,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: theme.spacing.xl,
    },
    empty: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.textSecondary,
      marginTop: 8,
    },
    emptySub: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
  });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd c:/Dev/mobile && npx jest src/screens/journal/__tests__/JournalScreen.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Run full suite**

Run: `cd c:/Dev/mobile && npm test`
Expected: All previously-passing tests still pass.

- [ ] **Step 6: Run typecheck**

Run: `cd c:/Dev/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Manual smoke test (if device available)**

- Open the Dziennik tab. Default = Lista.
- Tap "Kalendarz". Siatka pojawia się, dziś podświetlony, "21+3" pod każdą cyfrą (jeśli `conceptionDate` ustawiony).
- Tap dowolny dzień. Inline expansion pokazuje wpisy (lub "Brak wpisów") + przycisk "+ Dodaj wizytę".
- Tap "+ Dodaj wizytę". Sheet z polem nazwy (editable). Zapisz disabled gdy puste. Wpisz nazwę → Zapisz tworzy event w kalendarzu telefonu i wpis w dzienniku.
- Wróć na ekran. Wpis pojawia się jako kropka w kalendarzu, klik dnia pokazuje go w expansion.
- Strzałki ◀ ▶ przesuwają miesiąc.
- Zamknij i otwórz aplikację. Widok pamięta ostatni stan (kalendarz, jeśli był aktywny).

- [ ] **Step 8: Commit**

```bash
cd c:/Dev/mobile
git add src/screens/journal/JournalScreen.tsx src/screens/journal/__tests__/
git commit -m "feat(journal): add Lista/Kalendarz toggle with persistence"
```

---

## Self-Review

**Spec coverage:**
- ✅ Toggle "Lista | Kalendarz" w JournalScreen → Task 5
- ✅ Persistence w AsyncStorage `journal_view_mode` → Task 5
- ✅ Siatka miesiąca 7×6 z poniedziałkiem jako pierwszym dniem → Task 3 (`gridStart`)
- ✅ Komórka: cyfra dnia + "21+3" pod spodem + kropka jeśli wpisy → Task 3
- ✅ Klik dnia → inline expansion z wpisami + "+ Dodaj wizytę" → Task 4 (`CalendarDayDetail`, `JournalCalendarView`)
- ✅ Strzałki ◀ ▶ do nawigacji miesięcy → Task 4
- ✅ Sheet z editable nazwą + prefilled date → Task 2 (`AddExamSheet` rozszerzony) + Task 4 (użycie z `defaultDate`+`editableName`)
- ✅ Submit → createExamEvent + addJournalEntry typu 'exam' + reload → Task 4 (`handleSheetSubmit`)
- ✅ `getPregnancyWeekAndDay` z clampingiem i null dla dat przed → Task 1
- ✅ `formatWeekDay` "21+3" → Task 1
- ✅ Brak conceptionDate → kalendarz bez "21+3" → Task 3 (warunkowy `wd`)

**Placeholder scan:** brak TBD; wszystkie kroki mają konkretny kod.

**Type consistency:**
- `WeekAndDay` zdefiniowany w Task 1, używany w Task 3 (CalendarMonthGrid) i Task 4 (CalendarDayDetail).
- `getPregnancyWeekAndDay(conceptionDate, target)` — sygnatura spójna we wszystkich użyciach.
- `ExamSubmitPayload` rozszerzony w Task 2 o `name?`, używany w Task 4 (`payload.name?.trim()`).
- `entriesByDay: Record<string, JournalEntry[]>` — spójny klucz ISO `YYYY-MM-DD` w Task 3 (`toIsoDate`) i Task 4 (`groupBy entry.date` — uwaga: `entry.date` to już `YYYY-MM-DD` z Supabase).
- `viewMode: 'list' | 'calendar'` — typ spójny w Task 5.

**Notes:**
- Task 4 `groupBy` używa `entry.date` bezpośrednio (zakładamy format `YYYY-MM-DD` z Supabase). Task 3 `toIsoDate(date)` produkuje ten sam format z lokalnego `Date`. Zgodne.
- Task 4 woła `useAuth()` — istniejący hook (`mobile/src/context/AuthContext.tsx`). Zwraca `{ user, loading }`.
- Test `JournalCalendarView.test.tsx` mockuje `useAuth` i `useJournal` — spójne z istniejącym wzorcem (CheckupsScreen.flow.test.tsx).

Plan gotowy.
