import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Calendar from 'expo-calendar';
import { useTheme } from '../context/ThemeContext';
import { usePersistedChecklist } from '../hooks/usePersistedChecklist';
import { useCheckupVisits } from '../hooks/useAppData';
import type { Theme } from '../theme';
import Icon from '../components/Icon';

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

// Maps API colorKey strings to theme color values
const resolveColor = (colorKey: string, theme: Theme): string => {
  const c = theme.colors as Record<string, string>;
  return c[colorKey] || theme.colors.primary;
};


// Generate stable unique keys
const getItemKey = (vIdx: number, cIdx: number, iIdx: number) => `v${vIdx}-c${cIdx}-i${iIdx}`;
const getCatKey = (vIdx: number, cIdx: number) => `v${vIdx}-cat${cIdx}`;

// Count checkable items: singleCheck categories count as 1
const countCheckable = (visit: VisitPeriod) =>
  visit.categories.reduce((sum, cat) => sum + (cat.singleCheck ? 1 : cat.items.length), 0);

const countCheckedInVisit = (visit: VisitPeriod, vIdx: number, checked: Record<string, boolean>) =>
  visit.categories.reduce((sum, cat, cIdx) => {
    if (cat.singleCheck) return sum + (checked[getCatKey(vIdx, cIdx)] ? 1 : 0);
    return sum + cat.items.filter((_, iIdx) => checked[getItemKey(vIdx, cIdx, iIdx)]).length;
  }, 0);

async function getDefaultCalendarId(): Promise<string | null> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Brak uprawnień', 'Nie przyznano dostępu do kalendarza.');
    return null;
  }
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultCal = calendars.find(c => c.isPrimary) || calendars.find(c => c.allowsModifications) || calendars[0];
  if (!defaultCal) {
    Alert.alert('Brak kalendarza', 'Nie znaleziono kalendarza na tym urządzeniu.');
    return null;
  }
  return defaultCal.id;
}

async function addToCalendar(itemName: string, weekRange: string) {
  const calId = await getDefaultCalendarId();
  if (!calId) return;

  const startDate = new Date();
  startDate.setHours(9, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setHours(10, 0, 0, 0);

    try {
      await Calendar.createEventAsync(calId, {
        title: `Wizyta: ${itemName}`,
        notes: `Badania w ciąży – ${weekRange}\nDodane z aplikacji Hej Papa`,
        startDate,
        endDate,
        timeZone: 'Europe/Warsaw',
        alarms: [{ relativeOffset: -60 }], // 1h before
      });
      Alert.alert('Dodano do kalendarza ✓', `Wizyta „${itemName}" została dodana.\nPamiętaj, by zaktualizować dokładną datę i godzinę!`);
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się dodać wydarzenia. Sprawdź ustawienia.');
    }
}

export default function CheckupsScreen() {
  const { theme } = useTheme();
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const { data } = useCheckupVisits();
  const visits: VisitPeriod[] = data?.visits ?? [];
  const [expanded, setExpanded] = useState<number | null>(null);
  const { checked, toggleCheck } = usePersistedChecklist('checkups');

  const toggle = (idx: number) => {
    setExpanded(expanded === idx ? null : idx);
  };


  const totalItems = useMemo(() => {
    return visits.reduce((sum, v) => sum + countCheckable(v), 0);
  }, [visits]);

  const totalChecked = useMemo(() => {
    return Object.values(checked).filter(Boolean).length;
  }, [checked]);

  if (!data) {
    return (
      <View style={[s.c, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.textMuted }}>Ładowanie...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.c}>
      <View style={s.header}>
        <Icon name="calendar" size={48} color={theme.colors.checkups} />
        <Text style={s.title}>Wizyty Lekarskie</Text>
        <Text style={s.sub}>Baza najważniejszych badań i kontroli w ciąży</Text>
      </View>

      {/* Progress card */}
      <View style={s.progressCard}>
        <Text style={s.progressLabel}>Postęp badań</Text>
        <View style={s.progressRight}>
          <Text style={s.progressCount}>{totalChecked}/{totalItems}</Text>
          <Text style={s.progressCheckLabel}>odfajkowane zadania</Text>
        </View>
      </View>

      {visits.map((visit, vIdx) => {
        const isExpanded = expanded === vIdx;
        const visitItemCount = countCheckable(visit);
        const visitChecked = countCheckedInVisit(visit, vIdx, checked);

        return (
          <View key={vIdx} style={s.visitSection}>
            <TouchableOpacity style={[s.visitHeader, { borderLeftColor: resolveColor(visit.colorKey, theme) }]} onPress={() => toggle(vIdx)} accessibilityRole="button" accessibilityLabel={`${visit.title}, ${visitChecked} z ${visitItemCount} wykonanych`} accessibilityState={{ expanded: isExpanded }}>
              <View style={s.visitHeaderLeft}>
                <View style={[s.weekBadge, { backgroundColor: resolveColor(visit.colorKey, theme) }]}>
                  <Text style={s.weekBadgeText}>{visit.weekRange}</Text>
                </View>
                <Text style={s.visitTitle}>{visit.title}</Text>
                <Text style={s.visitSubtitle} numberOfLines={2}>{visit.subtitle}</Text>
              </View>
              <View style={s.visitHeaderRight}>
                <Text style={[s.visitProgress, { color: visitChecked === visitItemCount && visitItemCount > 0 ? theme.colors.primary : theme.colors.textMuted }]}>
                  {visitChecked}/{visitItemCount}
                </Text>
                <Icon name={isExpanded ? 'expand-less' : 'expand-more'} size={24} color={theme.colors.textMuted} />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View style={s.visitContent}>
                {visit.categories.map((cat, cIdx) => {
                  if (cat.singleCheck) {
                    // Render entire category as one checkable row
                    const catKey = getCatKey(vIdx, cIdx);
                    const isDone = checked[catKey] || false;
                    return (
                      <View key={cIdx} style={s.catSection}>
                        <View style={[s.singleCheckRow, isDone && s.checkItemDone]}>
                          <TouchableOpacity onPress={() => toggleCheck(catKey)} style={s.checkBtn} accessibilityRole="checkbox" accessibilityLabel={cat.title} accessibilityState={{ checked: isDone }}>
                            <Icon
                              name={isDone ? 'check-circle' : 'checkbox-blank'}
                              size={22}
                              color={isDone ? theme.colors.primary : theme.colors.textMuted}
                            />
                          </TouchableOpacity>
                          <View style={s.singleCheckInfo}>
                            <View style={s.singleCheckTitle}>
                              <Icon name={cat.icon} size={16} color={resolveColor(cat.colorKey, theme)} />
                              <Text style={[s.catTitleInline, isDone && s.checkNameDone]}> {cat.title}</Text>
                            </View>
                            {cat.items.map((item, iIdx) => (
                              <View key={iIdx} style={s.subItem}>
                                <Text style={s.subDot}>•</Text>
                                <Text style={[s.subItemText, isDone && s.subItemTextDone]}>
                                  {item.optional && <Text style={s.optional}>(opcja) </Text>}
                                  {item.name}
                                  {item.note ? <Text style={s.subItemNote}> – {item.note}</Text> : null}
                                </Text>
                              </View>
                            ))}
                          </View>
                          <TouchableOpacity
                            style={s.calBtn}
                            onPress={() => addToCalendar(cat.title, visit.weekRange)}
                            accessibilityRole="button"
                            accessibilityLabel={`Dodaj do kalendarza: ${cat.title}`}
                          >
                            <Icon name="date-range" size={20} color={theme.colors.checkups} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }

                  // Normal per-item rendering
                  return (
                  <View key={cIdx} style={s.catSection}>
                    <View style={s.catHeader}>
                      <Icon name={cat.icon} size={18} color={resolveColor(cat.colorKey, theme)} />
                      <Text style={s.catTitle}> {cat.title}</Text>
                      <Text style={[s.catCount, { color: resolveColor(cat.colorKey, theme) }]}>{cat.items.length}</Text>
                    </View>

                    {cat.items.map((item, iIdx) => {
                      const key = getItemKey(vIdx, cIdx, iIdx);
                      const isDone = checked[key] || false;
                      return (
                        <View key={iIdx} style={[s.checkItem, isDone && s.checkItemDone]}>
                          <TouchableOpacity onPress={() => toggleCheck(key)} style={s.checkBtn} accessibilityRole="checkbox" accessibilityLabel={item.name} accessibilityState={{ checked: isDone }}>
                            <Icon
                              name={isDone ? 'check-circle' : 'checkbox-blank'}
                              size={22}
                              color={isDone ? theme.colors.primary : theme.colors.textMuted}
                            />
                          </TouchableOpacity>
                          <View style={s.checkInfo}>
                            <Text style={[s.checkName, isDone && s.checkNameDone]}>
                              {item.optional && <Text style={s.optional}>(opcja) </Text>}
                              {item.name}
                            </Text>
                            {item.note && <Text style={s.checkNote}>{item.note}</Text>}
                          </View>
                          <TouchableOpacity
                            style={s.calBtn}
                            onPress={() => addToCalendar(item.name, visit.weekRange)}
                            accessibilityRole="button"
                            accessibilityLabel={`Dodaj do kalendarza: ${item.name}`}
                          >
                            <Icon name="date-range" size={20} color={theme.colors.checkups} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      <View style={s.disclaimer}>
        <Icon name="info" size={16} color={theme.colors.textMuted} />
        <Text style={s.disclaimerText}>Powyższa lista jest orientacyjna. O dokładnych badaniach, ich ilości i częstotliwości decyduje wyłącznie lekarz prowadzący ciążę, który na bieżąco analizuje stan zdrowia kobiety i dziecka.</Text>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  c: { flex: 1, backgroundColor: theme.colors.background },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.title, color: theme.colors.checkups, marginTop: theme.spacing.sm },
  sub: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },

  progressCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl, backgroundColor: theme.colors.checkups, borderRadius: theme.borderRadius.xl, paddingHorizontal: theme.spacing.lg, paddingVertical: 24, minHeight: 110 },
  progressLabel: { fontSize: theme.fontSize.lg, color: 'rgba(255,255,255,0.9)', fontWeight: theme.fontWeight.bold, flex: 1, marginRight: theme.spacing.md },
  progressRight: { alignItems: 'flex-end' },
  progressCount: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.white },
  progressCheckLabel: { fontSize: theme.fontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: theme.fontWeight.medium },

  visitSection: { marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm },
  visitHeader: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.xl, padding: theme.spacing.xl, elevation: 1, flexDirection: 'row', alignItems: 'center' },
  visitHeaderLeft: { flex: 1 },
  weekBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: theme.borderRadius.full, alignSelf: 'flex-start', marginBottom: theme.spacing.xs },
  weekBadgeText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold, color: theme.colors.white },
  visitTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  visitSubtitle: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },
  visitHeaderRight: { alignItems: 'flex-end', marginLeft: theme.spacing.sm },
  visitProgress: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, marginBottom: 4 },

  visitContent: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl, marginTop: 4, padding: theme.spacing.xl, elevation: 1 },

  catSection: { marginBottom: theme.spacing.lg },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  catTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.text, flex: 1 },
  catCount: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.full },

  // singleCheck category styles
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
  calBtn: { padding: 6, borderRadius: theme.borderRadius.sm, backgroundColor: 'rgba(92, 168, 255, 0.1)' },

  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg, padding: theme.spacing.xl, backgroundColor: theme.colors.surfaceLight, borderRadius: theme.borderRadius.xl },
  disclaimerText: { flex: 1, fontSize: 11, color: theme.colors.textMuted, lineHeight: 16, fontStyle: 'italic' },
});
