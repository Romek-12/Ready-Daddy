import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../theme';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

const isWeb = require('react-native').Platform.OS === 'web';

interface DateScrollPickerProps {
  onDateChange: (date: string) => void;
  initialDate?: string;
  maxDaysBack?: number;
  allowFuture?: boolean;   // allow selecting future dates (e.g. due date)
  maxDaysForward?: number; // how many days ahead to allow (default 310 ≈ 10 months)
}

export default function DateScrollPicker({ onDateChange, initialDate, maxDaysBack = 366, allowFuture = false, maxDaysForward = 310 }: DateScrollPickerProps) {
  const { theme } = useTheme();
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() - maxDaysBack);
  const maxDate = new Date(today);
  if (allowFuture) maxDate.setDate(maxDate.getDate() + maxDaysForward);

  const minYear = minDate.getFullYear();
  const maxYear = maxDate.getFullYear();

  const years = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  const parseInitial = () => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      const [y, m, d] = initialDate.split('-').map(Number);
      return { day: d, month: m, year: y };
    }
    return { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() };
  };

  const initial = parseInitial();
  const [selectedDay, setSelectedDay] = useState(initial.day);
  const [selectedMonth, setSelectedMonth] = useState(initial.month);
  const [selectedYear, setSelectedYear] = useState(initial.year);

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Clamp day if needed when month/year change
  useEffect(() => {
    const maxDay = getDaysInMonth(selectedMonth, selectedYear);
    if (selectedDay > maxDay) {
      setSelectedDay(maxDay);
    }
  }, [selectedMonth, selectedYear]);

  // Validate against min/max date and emit
  useEffect(() => {
    let d = selectedDay;
    let m = selectedMonth;
    let y = selectedYear;

    const selected = new Date(y, m - 1, d);
    if (selected > maxDate) {
      d = maxDate.getDate();
      m = maxDate.getMonth() + 1;
      y = maxDate.getFullYear();
    } else if (selected < minDate) {
      d = minDate.getDate();
      m = minDate.getMonth() + 1;
      y = minDate.getFullYear();
    }

    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    onDateChange(dateStr);
  }, [selectedDay, selectedMonth, selectedYear]);

  if (isWeb) {
    const minD = `${minYear}-${String(minDate.getMonth()+1).padStart(2, '0')}-${String(minDate.getDate()).padStart(2, '0')}`;
    const maxD = `${maxYear}-${String(maxDate.getMonth()+1).padStart(2, '0')}-${String(maxDate.getDate()).padStart(2, '0')}`;
    return (
      <View style={[s.container, { padding: 12, justifyContent: 'center' }]}>
        <input
          type="date"
          min={minD}
          max={maxD}
          defaultValue={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`}
          onChange={(e) => onDateChange(e.target.value)}
          style={{ padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ccc', width: '100%', fontFamily: 'inherit' }}
        />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.pickerRow}>
        <ScrollColumn
          data={days}
          selected={selectedDay}
          onChange={setSelectedDay}
          renderLabel={(v) => String(v).padStart(2, '0')}
          flex={0.8}
        />
        <ScrollColumn
          data={months}
          selected={selectedMonth}
          onChange={setSelectedMonth}
          renderLabel={(v) => MONTHS_PL[v - 1]}
          flex={1.5}
        />
        <ScrollColumn
          data={years}
          selected={selectedYear}
          onChange={setSelectedYear}
          renderLabel={(v) => String(v)}
          flex={1}
        />
      </View>
      <View style={s.overlay} pointerEvents="none">
        <View style={s.overlayTop} />
        <View style={s.highlightRow} />
        <View style={s.overlayBottom} />
      </View>
    </View>
  );
}

interface ScrollColumnProps {
  data: number[];
  selected: number;
  onChange: (val: number) => void;
  renderLabel: (val: number) => string;
  flex: number;
}

function ScrollColumn({ data, selected, onChange, renderLabel, flex }: ScrollColumnProps) {
  const { theme } = useTheme();
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const flatListRef = useRef<FlatList>(null);
  const isUserScrolling = useRef(false);
  const paddingItems = Math.floor(VISIBLE_ITEMS / 2);
  const paddedData = [
    ...Array(paddingItems).fill(null),
    ...data,
    ...Array(paddingItems).fill(null),
  ];

  // Scroll to selected on mount & data change
  useEffect(() => {
    const index = data.indexOf(selected);
    if (index >= 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: index * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, [data.length]);

  const onMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, data.length - 1));
    if (data[clamped] !== undefined) {
      onChange(data[clamped]);
    }
  }, [data, onChange]);

  const renderItem = useCallback(({ item }: { item: number | null }) => {
    if (item === null) return <View style={s.emptyItem} />;
    const isSelected = item === selected;
    return (
      <View style={s.item}>
        <Text style={[s.itemText, isSelected && s.itemTextSelected]}>
          {renderLabel(item)}
        </Text>
      </View>
    );
  }, [selected, renderLabel]);

  return (
    <View style={[s.column, { flex }]}>
      <FlatList
        ref={flatListRef}
        data={paddedData}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        style={{ height: PICKER_HEIGHT }}
        nestedScrollEnabled
      />
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    height: PICKER_HEIGHT,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  pickerRow: {
    flexDirection: 'row',
    height: PICKER_HEIGHT,
  },
  column: {
    height: PICKER_HEIGHT,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyItem: {
    height: ITEM_HEIGHT,
  },
  itemText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
  itemTextSelected: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 26, 0.65)',
  },
  highlightRow: {
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.primary + '40',
    backgroundColor: 'rgba(0, 217, 166, 0.06)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 26, 0.65)',
  },
});
